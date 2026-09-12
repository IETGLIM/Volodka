/**
 * Чистые (side-effect free) профили пост-обработки по сценам — этап 98.
 *
 * До этапа 98 таблицы SCENE_* жили внутри ExplorationPostFX.tsx, а смена сцены
 * меняла pipelineKey композера → полный ремaунт EffectComposer'а и 8–10
 * перекомпиляций шейдеров (250–2000 мс stall на переходе). Теперь профиль —
 * чистая функция от sceneId: пер-сценные вариации применяются императивно
 * (uniform-запись + pass.enabled / LUT-swap), композер живёт между сценами.
 *
 * Семантика фолбэков сохранена байт-в-байт относительно прежнего кода:
 *  - colorGrade / vignette / bloom / chromatic / aoColor / toneExposure —
 *    прямой ключ → родитель по сцене-наследнику (resolveDerivedSceneId) → дефолт;
 *  - wantsNoise / wantsScanlines / isHeroPostFx / lutKind / godRaysSun —
 *    только прямой ключ (как раньше: Set.has(sceneId), без наследования).
 */

import { resolveDerivedSceneId } from '@/config/sceneInheritance';
import type { SceneId } from '@/shared/types/game';
import { SCENE_VISIBILITY } from '@/shared/constants/sceneVisibility';
import { resolveProceduralLutKind, type ProceduralLutKind } from '@/engine/graphics/proceduralLutTextures';

/** Per-scene chromatic aberration tuning — cinematic lens character varies by mood. **/
const SCENE_CHROMATIC: Record<string, { baseAmount: number; stressMax: number }> = {
  volodka_room:       { baseAmount: 0.15, stressMax: 0.0 },  // Clean CRT monitors — no fringing
  volodka_corridor:   { baseAmount: 0.22, stressMax: 0.6 },  // Noir corridor gets subtle stress ramp
  street_night:       { baseAmount: 0.25, stressMax: 0.8 },  // Wet noir — moderate lens character
  cafe_evening:       { baseAmount: 0.20, stressMax: 0.5 },  // Hazy blue-neon café
  sleep_dream:        { baseAmount: 0.30, stressMax: 0.0 },  // Dreamy — persistent soft fringing
  abandoned_factory:  { baseAmount: 0.18, stressMax: 0.4 },  // Industrial — restrained
  factory_basement:   { baseAmount: 0.16, stressMax: 0.3 },  // Zarya-M — clinical
  chk_campfire_night: { baseAmount: 0.22, stressMax: 0.0 },  // Warm fire — no stress ramp
  city_square:        { baseAmount: 0.22, stressMax: 0.6 },  // Plaza noir
  library_day:        { baseAmount: 0.12, stressMax: 0.0 },  // Reading — minimal
  home_evening:       { baseAmount: 0.14, stressMax: 0.0 },  // Cozy — minimal
  river_pier:         { baseAmount: 0.20, stressMax: 0.4 },  // Pier dusk
  pier_evening:       { baseAmount: 0.22, stressMax: 0.5 },  // Evening pier
  rooftop_edge:       { baseAmount: 0.28, stressMax: 0.0 },  // Galaxy sunset — persistent
  battle:             { baseAmount: 0.10, stressMax: 1.0 },  // Combat — clean at rest, strong under stress
};
const DEFAULT_CHROMATIC = { baseAmount: 0.18, stressMax: 0.5 };

/** Per-scene bloom emissive bias — scenes with neon/emissive need lower threshold to bloom those sources **/
const SCENE_BLOOM_EMISSIVE_BOOST: Record<string, number> = {
  volodka_room: 0.08,       // Monitor glow — lower threshold catches CRT emissive
  street_night: 0.14,       // Neon signs — strong emissive boost for wet noir
  cafe_evening: 0.10,       // Blue neon bar
  factory_basement: 0.10,   // Zarya-M core glow
  underground_bunker: 0.08, // CRT green glow
  city_square: 0.10,        // Plaza neon
  guild_mainframe: 0.14,    // Server rack glow
  sleep_dream: 0.08,        // Ethereal glow
  river_pier: 0.08,         // Fire + string lights emissive
  pier_evening: 0.10,       // Evening pier neon
  chk_campfire_night: 0.10, // Fire emissive
  chk_forest_zorge: 0.08,   // Campfire warm emissive
};

/** Per-scene color grading overrides for CyberPunk2077 / Noir / Gothic feel */
const SCENE_COLOR_GRADE: Record<string, { hue: number; saturation: number; brightness: number; contrast: number }> = {
  volodka_room:       { hue: -0.05, saturation: 0.08, brightness: 0.01, contrast: 0.22 }, // CRT room — filmic, not candy
  volodka_corridor:   { hue: -0.04, saturation: -0.18, brightness: 0.0, contrast: 0.24 }, // oppressive noir
  home_evening:       { hue: 0.05,  saturation: 0.12, brightness: 0.015, contrast: 0.13 }, // warm amber mood
  street_night:       { hue: 0.04,  saturation: 0.12, brightness: 0.02, contrast: 0.28 }, // wet noir — not candy neon
  procedural_aaa:     { hue: 0.03,  saturation: 0.11, brightness: 0.02, contrast: 0.26 },
  street_winter:      { hue: -0.02, saturation: -0.12, brightness: 0.12, contrast: 0.08  },
  cafe_evening:       { hue: 0.06,  saturation: 0.20, brightness: 0.02, contrast: 0.16 }, // hazy blue-neon café
  office_day:         { hue: -0.02, saturation: -0.12, brightness: 0.04, contrast: 0.08 }, // sterile overcast
  park_day:           { hue: -0.02, saturation: 0.02, brightness: 0.06, contrast: 0.14 }, // gothic haze
  library_day:        { hue: 0.03,  saturation: 0.06, brightness: 0.02, contrast: 0.12 }, // dusty amber reading light
  battle:             { hue: 0.08,  saturation: 0.2,  brightness: -0.05, contrast: 0.35 }, // intense combat
  sleep_dream:        { hue: 0.22,  saturation: 0.55, brightness: 0.06, contrast: 0.18 }, // galaxy dream grade
  rooftop_edge:       { hue: 0.07,  saturation: 0.20, brightness: 0.06, contrast: 0.22 }, // galaxy sunset noir
  abandoned_factory:  { hue: 0.06,  saturation: -0.03, brightness: 0.02, contrast: 0.16 },
  factory_basement:   { hue: -0.04, saturation: -0.05, brightness: 0.0,  contrast: 0.2 },
  zarema_albert_room: { hue: 0.02,  saturation: 0.05, brightness: 0.03, contrast: 0.08 },
  solnysh_room:       { hue: 0.05,  saturation: 0.12, brightness: 0.02, contrast: 0.1  }, // warm cozy carpets
  chk_forest_zorge:   { hue: 0.03,  saturation: 0.08, brightness: 0.05, contrast: 0.1 }, // campfire warmth
  river_pier:         { hue: 0.04,  saturation: 0.1,  brightness: 0.04, contrast: 0.12 }, // warm fire vs cold water
  pier_evening:       { hue: 0.05,  saturation: 0.12, brightness: 0.02, contrast: 0.14 }, // amber pier dusk
  chk_campfire_night: { hue: 0.05,  saturation: 0.14, brightness: 0.03, contrast: 0.14 }, // fire-lit noir
  factory_roof:       { hue: 0.02,  saturation: -0.04, brightness: 0.03, contrast: 0.16 }, // industrial dusk
  city_square:        { hue: -0.02, saturation: 0.08, brightness: 0.02, contrast: 0.16 }, // cool plaza neon
  underground_bunker: { hue: -0.06, saturation: -0.02, brightness: -0.02, contrast: 0.22 }, // resistance green CRT
};

const DEFAULT_COLOR_GRADE = { hue: 0, saturation: 0, brightness: 0, contrast: 0.15 };

/** Scenes that get subtle film grain for cinematic feel (high/ultra).
 *  Includes indoor scenes and evening/night outdoor scenes for noir texture. */
const NOISE_SCENES = new Set([
  'volodka_room', 'volodka_corridor', 'home_evening', 'library_day',
  'factory_basement', 'zarema_albert_room', 'solnysh_room',
  'guild_mainframe', 'albert_backroom', 'zarema_room',
  'library_basement', 'underground_bunker', 'sleep_dream',
  // Evening/night outdoor — cinematic noir grain
  'street_night', 'cafe_evening', 'river_pier', 'pier_evening',
  'chk_campfire_night', 'chk_forest_zorge',
]);

/** Scenes that get CRT scanline overlay for cyberpunk terminal aesthetic */
// FIX S13-1: 'volodka_room' removed — scanlines caused unreadable flashing
// horizontal lines on the 3 desk monitors. guild_mainframe + office_day keep
// the treatment (they have dedicated CRT terminals, not desktop LCDs).
const SCANLINE_SCENES = new Set(['guild_mainframe', 'office_day']);

/** Scene-specific vignette darkness — noir scenes get heavier vignette */
const SCENE_VIGNETTE: Record<string, { offset: number; darkness: number }> = {
  volodka_room:       { offset: 0.32, darkness: 0.42 },
  volodka_corridor:   { offset: 0.28, darkness: 0.40 },
  home_evening:       { offset: 0.4,  darkness: 0.35 },
  street_night:       { offset: 0.4,  darkness: 0.3 },
  procedural_aaa:     { offset: 0.36, darkness: 0.34 },
  cafe_evening:       { offset: 0.34, darkness: 0.36 },
  sleep_dream:        { offset: 0.25, darkness: 0.42 },
  abandoned_factory:  { offset: 0.32, darkness: 0.36 },
  rooftop_edge:       { offset: 0.3,  darkness: 0.32 },
  battle:             { offset: 0.2,  darkness: 0.6 },
  office_day:         { offset: 0.4,  darkness: 0.3 },
  park_day:           { offset: 0.35, darkness: 0.35 },
  library_day:        { offset: 0.4,  darkness: 0.3 },
  street_winter:      { offset: 0.44, darkness: 0.18 },
  zarema_albert_room: { offset: 0.4,  darkness: 0.3 },
  solnysh_room:       { offset: 0.42, darkness: 0.28 },
  chk_forest_zorge:   { offset: 0.4,  darkness: 0.28 },
  factory_basement:   { offset: 0.3,  darkness: 0.38 },
  river_pier:         { offset: 0.4,  darkness: 0.26 },
  pier_evening:       { offset: 0.38, darkness: 0.3 },
  chk_campfire_night: { offset: 0.36, darkness: 0.34 },
  factory_roof:       { offset: 0.34, darkness: 0.3 },
  city_square:        { offset: 0.38, darkness: 0.28 },
  underground_bunker: { offset: 0.28, darkness: 0.4 },
  guild_mainframe:    { offset: 0.3,  darkness: 0.36 },
  albert_backroom:    { offset: 0.36, darkness: 0.32 },
  zarema_room:        { offset: 0.38, darkness: 0.3 },
  library_basement:   { offset: 0.3,  darkness: 0.4 },
};
const DEFAULT_VIGNETTE = { offset: 0.4, darkness: 0.32 };

/** Dynamic bloom intensity per scene — neon scenes bloom brighter */
const SCENE_BLOOM: Record<string, { intensity: number; threshold: number; smoothing: number }> = {
  volodka_room:       { intensity: 0.5, threshold: 0.66, smoothing: 0.5 }, // preserve monitor glow without blooming white room surfaces
  volodka_corridor:   { intensity: 0.35, threshold: 0.72, smoothing: 0.55 }, // dim corridor haze
  home_evening:       { intensity: 0.48, threshold: 0.66, smoothing: 0.48 },  // warm lamp bloom
  street_night:       { intensity: 0.62, threshold: 0.52, smoothing: 0.48 }, // wet neon — restrained
  procedural_aaa:     { intensity: 0.58, threshold: 0.5, smoothing: 0.5 },
  cafe_evening:       { intensity: 0.58, threshold: 0.52, smoothing: 0.46 }, // blue neon bar glow
  office_day:         { intensity: 0.28, threshold: 0.82, smoothing: 0.58 }, // fluorescent spill
  park_day:           { intensity: 0.42, threshold: 0.74, smoothing: 0.52 },
  library_day:        { intensity: 0.32, threshold: 0.78, smoothing: 0.55 },  // banker-lamp glow
  battle:             { intensity: 0.9,  threshold: 0.5,  smoothing: 0.4 },  // intense combat flash
  sleep_dream:        { intensity: 0.68, threshold: 0.52, smoothing: 0.44 }, // galaxy ethereal glow
  rooftop_edge:       { intensity: 0.58, threshold: 0.54, smoothing: 0.46 }, // galaxy sunset bloom
  abandoned_factory:  { intensity: 0.35, threshold: 0.7, smoothing: 0.55 },  // ember glow (lighter GPU load)
  street_winter:      { intensity: 0.3,  threshold: 0.8, smoothing: 0.6 },  // cold
  zarema_albert_room: { intensity: 0.35, threshold: 0.72, smoothing: 0.5 },  // warm domestic lamp glow
  solnysh_room:       { intensity: 0.38, threshold: 0.68, smoothing: 0.48 }, // warm lamp glow
  chk_forest_zorge:   { intensity: 0.45, threshold: 0.55, smoothing: 0.45 }, // campfire bloom
  factory_basement:   { intensity: 0.55, threshold: 0.5,  smoothing: 0.45 }, // Заря-М core glow
  river_pier:         { intensity: 0.5,  threshold: 0.55, smoothing: 0.45 }, // fire + string lights
  pier_evening:       { intensity: 0.55, threshold: 0.52, smoothing: 0.44 }, // evening pier neon
  chk_campfire_night: { intensity: 0.62, threshold: 0.48, smoothing: 0.42 }, // fire bloom
  factory_roof:       { intensity: 0.4,  threshold: 0.62, smoothing: 0.5 },  // dusk skyline
  city_square:        { intensity: 0.58, threshold: 0.55, smoothing: 0.48 }, // plaza — wet filmic, not candy
  underground_bunker: { intensity: 0.48, threshold: 0.55, smoothing: 0.46 }, // resistance CRT glow
  guild_mainframe:    { intensity: 0.6,  threshold: 0.5,  smoothing: 0.42 }, // server rack bloom
};
const DEFAULT_BLOOM = { intensity: 0.5, threshold: 0.7, smoothing: 0.5 };

/** Hero mood scenes — get the most authored post-FX treatment (eskil vignette, etc.).
 *  These are the 6 strongest practical-light / hero IBL scenes where the extra
 *  photographic falloff reads as a real lens rather than a game-engine overlay. */
const HERO_POSTFX_SCENES = new Set<SceneId>([
  'volodka_room', 'street_night', 'city_square', 'cafe_evening', 'library_day', 'home_evening',
  // AAA Phase A: piers now hero cinematic — fire + water + dusk get full eskil vignette + ultra polish
  'river_pier', 'pier_evening',
  // AAA Phase A: sleep_dream is the ultimate cinematic moment — full hero postFX (eskil vignette, dense DOF, ultra bloom) for ethereal galaxy feel
  'sleep_dream',
]);

/** Tinted ambient-occlusion color per scene. Black AO reads as game-engine SSAO;
 *  a hue-matched AO reads as physically absorbed light — the single biggest
 *  "deplasticizer" lever. Default falls back to black (stock behaviour). */
const SCENE_AO_COLOR: Record<string, string> = {
  street_night:       '#0a0a14', // cool blue-black neon shadow
  city_square:        '#0c0e16', // cool plaza shadow
  home_evening:       '#140d08', // warm amber lamp shadow
  volodka_room:       '#0c0a14', // monitor-lit blue-black
  cafe_evening:       '#0a0c14', // blue neon shadow
  factory_basement:   '#08120c', // green Zarya-M shadow
  chk_campfire_night: '#100804', // warm fire shadow
  underground_bunker: '#08120c', // resistance green CRT shadow
  library_day:        '#100c06', // dusty amber reading shadow
  river_pier:         '#100a04', // warm fire-on-water shadow
};

/** Per-scene ACES tone-mapping exposure. The global `SCENE_VISIBILITY.toneExposure`
 *  is a flat 1.22 — this table unlocks authored per-scene exposure keys so a
 *  battle reads darker/more contrasty than a sunset dream. Falls back to global.
 *
 *  ИСТОРИЧЕСКАЯ ЗАМЕТКА (этап 98): ToneMappingEffect в postprocessing 6.39 не
 *  имеет exposure — проп `exposure` у обёртки <ToneMapping> исторически no-op
 *  (r3f applyProps кладёт мёртвое свойство на инстанс эффекта). Значения таблицы
 *  сохраняются в профиле ради документации и будущего включения; поведение
 *  рендера этап 98 не меняет. */
const SCENE_TONE_EXPOSURE: Record<string, number> = {
  volodka_room:       1.12, // recover pale surface detail under clustered practicals
  battle:             1.05, // darker, more contrast for combat
  sleep_dream:        1.35, // lifted ethereal
  rooftop_edge:       1.30, // sunset glow
  factory_roof:       1.28,
  street_winter:      1.30, // bright snow
  volodka_corridor:   1.12, // crushed noir corridor
  underground_bunker: 1.10, // CRT-dark
};

/* ─── GodRays: пер-сценная конфигурация «солнца» (перенесено из GodRaysSunMesh) ─── */

export interface GodRaysSunConfig {
  position: [number, number, number];
  color: string;
}

/** Per-scene sun mesh configs. Positions match GODRAY_PRESETS in GodRays.tsx
 *  so the postprocessing rays emanate from the same origin as the mesh-based
 *  shafts (complementary layers, not duplicates).
 *
 *  Positions + colors are sourced from `SCENE_ACCENT_LIGHTS` in Lighting.tsx
 *  so the sun mesh aligns with the actual visible practical light source
 *  (streetlamp / campfire / sunset / yard lamp) rather than the mesh-shaft
 *  center. This keeps the postprocessing rays anchored to a real bulb. */
const GODRAYS_SUN_CONFIG: Partial<Record<SceneId, GodRaysSunConfig>> = {
  home_evening: {
    position: [0, 2.5, 0],
    color: '#ffaa44',
  },
  factory_basement: {
    position: [0, 2.6, -5.2],
    color: '#22ff88',
  },
  // ── Expansion coverage (ultra-only postprocessing GodRays) ──
  // Positions mirror SCENE_ACCENT_LIGHTS in Lighting.tsx so the sun mesh
  // sits exactly on the visible practical light bulb.
  street_night: {
    // Pink neon streetlamp on the left side of the plaza.
    position: [-6, 3, -2],
    color: '#d88a9c',
  },
  city_square: {
    // Central plaza lamp (shadowCaster) — cool blue-white halo.
    position: [0, 4.2, 0],
    color: '#aaccff',
  },
  river_pier: {
    // Barrel fire at the pier head — warm flickering orange.
    position: [0, 1.5, -1],
    color: '#ff9944',
  },
  rooftop_edge: {
    // Sunset warm practical — rooftop edge hero lamp.
    position: [-3, 3, 0],
    color: '#ff8844',
  },
  chk_campfire_night: {
    // Campfire in the CHK clearing — primary fire light.
    position: [0, 1.2, 0],
    color: '#ff8833',
  },
  factory_roof: {
    // Factory yard lamp — industrial warm sodium.
    position: [-3, 3, 0],
    color: '#ff7744',
  },
  // AAA Phase A: expand ultra post godrays to more hero interiors for luxurious volumetric shafts
  cafe_evening: {
    // Neon bar glow + window spill
    position: [-3, 2.5, 0],
    color: '#4488ff',
  },
  library_day: {
    // Banker lamp / reading light shafts
    position: [5, 3, 0],
    color: '#ffdd99',
  },
  pier_evening: {
    // Pier fire + dusk light
    position: [0, 2.2, -2],
    color: '#ff9944',
  },
  // AAA Phase A: dream gets ultra screen-space godrays too (ethereal cosmic light source for postprocessing GodRaysEffect)
  sleep_dream: {
    position: [0, 5.5, 0],
    color: '#aa77ff',
  },
};

export function getGodRaysSunConfig(sceneId: SceneId): GodRaysSunConfig | null {
  return GODRAYS_SUN_CONFIG[sceneId] ?? null;
}

export const GODRAYS_POST_SCENES = new Set<SceneId>(
  Object.keys(GODRAYS_SUN_CONFIG) as SceneId[],
);

/* ─── Сводный профиль сцены ─── */

export interface ScenePostFxProfile {
  /** HueSaturation + BrightnessContrast grade. */
  colorGrade: { hue: number; saturation: number; brightness: number; contrast: number };
  /** Статичная форма виньетки (eskil считается отдельно: isHeroPostFx && ultra). */
  vignette: { offset: number; darkness: number };
  /** Форма блума: базовая интенсивность, порог, сглаживание. */
  bloom: { intensity: number; threshold: number; smoothing: number };
  /** Смещение порога блума для неоновых/эмиссивных сцен. */
  bloomEmissiveBoost: number;
  /** Характер хроматической аберрации. */
  chromatic: { baseAmount: number; stressMax: number };
  /** Оттенок SSAO (N8AO). */
  aoColor: string;
  /** Пер-сценная экспозиция тонмаппинга (см. историческую заметку — no-op). */
  toneExposure: number;
  /** Зерно плёнки разрешено для сцены (high/ultra + filmGrainEnabled). */
  wantsNoise: boolean;
  /** CRT-сканлайны разрешены для сцены. */
  wantsScanlines: boolean;
  /** Hero-сцена: eskil-виньетка на ultra. */
  isHeroPostFx: boolean;
  /** Процедурный 3D-LUT (null = нейтральный passthrough). */
  lutKind: ProceduralLutKind | null;
  /** Конфиг GodRays-«солнца» (null = экранные лучи для сцены выключены). */
  godRaysSun: GodRaysSunConfig | null;
}

/**
 * Чистый резолвер профиля пост-обработки по sceneId.
 * Вызывается на scene:transition_start (под визиром SceneTransitionVeil),
 * на монтировании пайплайна и в unit-тестах. Результат заморожен.
 */
export function resolveScenePostFxProfile(sceneId: SceneId): ScenePostFxProfile {
  const derived = resolveDerivedSceneId(sceneId);

  const colorGrade =
    SCENE_COLOR_GRADE[sceneId] ?? SCENE_COLOR_GRADE[derived] ?? DEFAULT_COLOR_GRADE;
  const vignette =
    SCENE_VIGNETTE[sceneId] ?? SCENE_VIGNETTE[derived] ?? DEFAULT_VIGNETTE;
  const bloom =
    SCENE_BLOOM[sceneId] ?? SCENE_BLOOM[derived] ?? DEFAULT_BLOOM;
  const chromatic =
    SCENE_CHROMATIC[sceneId] ?? SCENE_CHROMATIC[derived] ?? DEFAULT_CHROMATIC;
  const aoColor =
    SCENE_AO_COLOR[sceneId] ?? SCENE_AO_COLOR[derived] ?? 'black';
  const toneExposure =
    SCENE_TONE_EXPOSURE[sceneId] ?? SCENE_TONE_EXPOSURE[derived] ?? SCENE_VISIBILITY.toneExposure;

  const profile: ScenePostFxProfile = {
    colorGrade,
    vignette,
    bloom,
    bloomEmissiveBoost: SCENE_BLOOM_EMISSIVE_BOOST[sceneId] ?? 0,
    chromatic,
    aoColor,
    toneExposure,
    wantsNoise: NOISE_SCENES.has(sceneId),
    wantsScanlines: SCANLINE_SCENES.has(sceneId),
    isHeroPostFx: HERO_POSTFX_SCENES.has(sceneId),
    lutKind: resolveProceduralLutKind(sceneId),
    godRaysSun: getGodRaysSunConfig(sceneId),
  };

  return Object.freeze(profile);
}
