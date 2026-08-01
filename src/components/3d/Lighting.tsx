
/* ─── Volodka RPG – Exploration lighting ───
 *  Per-scene lighting with noir-friendly indoor settings.
 *  Indoor rooms rely on scene-specific point lights (monitor, lamp, window)
 *  rather than bright uniform ambient, preserving atmospheric shadows.
 */

import { useGameStore } from '@/store/gameStore';
import { getSceneConfig } from '@/config/scenes';
import { resolveDerivedSceneId } from '@/config/sceneInheritance';
import { useIsMobileVisual, useMobileVisualPerf } from '@/hooks/use-mobile';
import { useGraphicsQuality } from '@/engine/graphics/useGraphicsQuality';
import { resolveSceneRenderingPipeline } from '@/engine/graphics/resolveSceneRenderingPipeline';
import { SCENE_VISIBILITY } from '@/shared/constants/sceneVisibility';
import type { SceneId } from '@/shared/types/game';
import { useRef, useMemo, useCallback } from 'react';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import { useTimeOfDay } from '@/store/selectors/explorationSelectors';
import * as THREE from 'three';

/** Shadow config constants — tuned to prevent z-fighting/shadow acne */
const SHADOW_BIAS = -0.002;
const SHADOW_NORMAL_BIAS = 0.04;

/* ─── Time-of-day keyframe system for outdoor scenes ─── */

interface TimeOfDayKeyframe {
  hour: number;
  sunColor: string;
  sunIntensity: number;
  sunPosition: [number, number, number];
  ambientColor: string;
  ambientIntensity: number;
  hemiSkyColor: string;
  hemiGroundColor: string;
  hemiIntensity: number;
}

const TIME_OF_DAY_KEYFRAMES: TimeOfDayKeyframe[] = [
  {
    hour: 5,
    sunColor: '#ff8844',
    sunIntensity: 1.0,
    sunPosition: [-10, 3, 2],
    ambientColor: '#886655',
    ambientIntensity: 0.7,
    hemiSkyColor: '#ddaa77',
    hemiGroundColor: '#443322',
    hemiIntensity: 0.5,
  },
  {
    hour: 8,
    sunColor: '#ffe8cc',
    sunIntensity: 1.8,
    sunPosition: [8, 8, 4],
    ambientColor: '#998877',
    ambientIntensity: 1.0,
    hemiSkyColor: '#aabbdd',
    hemiGroundColor: '#556644',
    hemiIntensity: 0.8,
  },
  {
    hour: 12,
    sunColor: '#ffffff',
    sunIntensity: 2.5,
    sunPosition: [0, 14, 2],
    ambientColor: '#cccccc',
    ambientIntensity: 1.2,
    hemiSkyColor: '#88aadd',
    hemiGroundColor: '#446633',
    hemiIntensity: 1.0,
  },
  {
    hour: 15,
    sunColor: '#fff0dd',
    sunIntensity: 2.0,
    sunPosition: [-8, 10, 3],
    ambientColor: '#aa9977',
    ambientIntensity: 1.0,
    hemiSkyColor: '#99aacc',
    hemiGroundColor: '#555544',
    hemiIntensity: 0.8,
  },
  {
    hour: 19,
    sunColor: '#ff6622',
    sunIntensity: 1.4,
    sunPosition: [-12, 3, -2],
    ambientColor: '#774433',
    ambientIntensity: 0.6,
    hemiSkyColor: '#dd7744',
    hemiGroundColor: '#332211',
    hemiIntensity: 0.45,
  },
  {
    hour: 22,
    sunColor: '#4466aa',
    sunIntensity: 0.5,
    sunPosition: [6, 8, -4],
    ambientColor: '#223344',
    ambientIntensity: 0.3,
    hemiSkyColor: '#223355',
    hemiGroundColor: '#111111',
    hemiIntensity: 0.3,
  },
];

/** Pre-allocate Color objects for keyframe lookups to avoid GC in lerp */
const KEYFRAME_COLORS = TIME_OF_DAY_KEYFRAMES.map((kf) => ({
  sun: new THREE.Color(kf.sunColor),
  ambient: new THREE.Color(kf.ambientColor),
  hemiSky: new THREE.Color(kf.hemiSkyColor),
  hemiGround: new THREE.Color(kf.hemiGroundColor),
}));

/** Scenes that should mute time-of-day sun by 60% (have their own atmospheric accents) */
const MUTED_TOD_SCENES = new Set(['sleep_dream', 'battle']);

function lerpKeyframes(hour: number) {
  // Wrap hour into 0–24 range
  const h = ((hour % 24) + 24) % 24;
  const kfLen = TIME_OF_DAY_KEYFRAMES.length;

  // Find the two bracketing keyframes
  let prevIdx = 0;
  for (let i = 0; i < kfLen; i++) {
    if (TIME_OF_DAY_KEYFRAMES[i].hour >= h) {
      prevIdx = (i - 1 + kfLen) % kfLen;
      break;
    }
    prevIdx = i;
  }

  const a = TIME_OF_DAY_KEYFRAMES[prevIdx];
  const b = TIME_OF_DAY_KEYFRAMES[(prevIdx + 1) % kfLen];
  const colorsA = KEYFRAME_COLORS[prevIdx];
  const colorsB = KEYFRAME_COLORS[(prevIdx + 1) % kfLen];

  // Compute t in [0, 1] between the two keyframes
  let span = b.hour - a.hour;
  if (span <= 0) span += 24; // wrap midnight
  let t = h - a.hour;
  if (t < 0) t += 24;
  t = t / span;
  // Smoothstep for pleasant transitions
  t = t * t * (3 - 2 * t);

  return {
    t,
    sunColorA: colorsA.sun,
    sunColorB: colorsB.sun,
    sunIntensity: a.sunIntensity + (b.sunIntensity - a.sunIntensity) * t,
    sunPosition: [
      a.sunPosition[0] + (b.sunPosition[0] - a.sunPosition[0]) * t,
      a.sunPosition[1] + (b.sunPosition[1] - a.sunPosition[1]) * t,
      a.sunPosition[2] + (b.sunPosition[2] - a.sunPosition[2]) * t,
    ] as [number, number, number],
    ambientColorA: colorsA.ambient,
    ambientColorB: colorsB.ambient,
    ambientIntensity: a.ambientIntensity + (b.ambientIntensity - a.ambientIntensity) * t,
    hemiSkyColorA: colorsA.hemiSky,
    hemiSkyColorB: colorsB.hemiSky,
    hemiGroundColorA: colorsA.hemiGround,
    hemiGroundColorB: colorsB.hemiGround,
    hemiIntensity: a.hemiIntensity + (b.hemiIntensity - a.hemiIntensity) * t,
  };
}

/** Smooth interpolation speed factor (per second, exponential lerp) */
const TOD_LERP_SPEED = 2.5;

/** Per-scene indoor ambient overrides — noir rooms need very low ambient
 *  to let scene-specific lights (monitor, lamp, window) drive the atmosphere.
 *  Format: { color, intensity } */
const INDOOR_AMBIENT: Record<string, { color: string; intensity: number }> = {
  volodka_room:       { color: '#2a2538', intensity: 0.55 },
  volodka_corridor:   { color: '#2a2438', intensity: 0.52 },
  home_evening:       { color: '#4a3828', intensity: 0.62 },
  cafe_evening:       { color: '#2a3048', intensity: 0.58 },
  office_day:         { color: '#c0c8d0', intensity: 0.65 },
  library_day:        { color: '#4a4438', intensity: 0.62 },
  library_basement:   { color: '#2a2418', intensity: 0.42 },
  abandoned_factory:  { color: '#3a3228', intensity: 0.58 },
  factory_basement:   { color: '#283830', intensity: 0.55 },
  solnysh_room:       { color: '#3a3428', intensity: 0.6 },
  sleep_dream:        { color: '#3a2850', intensity: 0.58 },
  guild_mainframe:    { color: '#1a2838', intensity: 0.48 },
  albert_backroom:    { color: '#2a2038', intensity: 0.5 },
  underground_bunker: { color: '#1a2820', intensity: 0.46 },
};
const DEFAULT_INDOOR_AMBIENT = { color: '#2a2a3a', intensity: 0.52 };

/** Per-scene indoor fill light overrides — subtle fill to prevent
 *  completely black corners while preserving noir shadows.
 *  Format: { position, intensity, color, distance } or null to disable */
const INDOOR_FILL: Record<string, { position: [number, number, number]; intensity: number; color: string; distance: number } | null> = {
  volodka_room:       { position: [0, 2.2, -0.5], intensity: 1.35, color: '#6a5a78', distance: 10 },
  volodka_corridor:   { position: [0, 2.2, 0], intensity: 1.4, color: '#998877', distance: 12 },
  home_evening:       { position: [0, 2.2, 0], intensity: 2.2, color: '#ddaa77', distance: 12 },
  cafe_evening:       { position: [0, 2.5, -1], intensity: 1.75, color: '#aa99cc', distance: 13 },
  office_day:         { position: [0, 2.5, 0], intensity: 2.8, color: '#dde8f8', distance: 16 },
  library_day:        { position: [0, 2.5, 0], intensity: 1.85, color: '#ccaa77', distance: 14 },
  library_basement:   { position: [0, 2.0, -1], intensity: 1.15, color: '#aa8844', distance: 10 },
  abandoned_factory:  { position: [0, 3.0, 0], intensity: 1.45, color: '#cc9966', distance: 16 },
  factory_basement:   { position: [0, 2.4, 0], intensity: 1.35, color: '#668877', distance: 14 },
  zarema_albert_room: { position: [0, 2.2, 0], intensity: 1.65, color: '#aa9977', distance: 12 },
  solnysh_room:       { position: [0, 2.2, 0], intensity: 1.7, color: '#ccaa88', distance: 11 },
  sleep_dream:        { position: [0, 2.4, 0], intensity: 1.5, color: '#8866aa', distance: 14 },
  guild_mainframe:    { position: [0, 2.4, -1], intensity: 1.85, color: '#66ccaa', distance: 11 },
  albert_backroom:    { position: [0, 2.0, -0.5], intensity: 1.75, color: '#ddaa77', distance: 9 },
  underground_bunker: { position: [0, 2.3, -1], intensity: 1.55, color: '#66aa88', distance: 12 },
};
const OUTDOOR_READABILITY_AMBIENT: Record<string, { intensity: number; color: string }> = {
  park_day:         { intensity: 0.14, color: '#8a9888' },
  rooftop_edge:     { intensity: 0.12, color: '#8899aa' },
  river_pier:       { intensity: 0.13, color: '#778899' },
  city_square:      { intensity: 0.13, color: '#6a7890' },
  chk_forest_zorge: { intensity: 0.11, color: '#6a7868' },
  chk_campfire_night: { intensity: 0.14, color: '#5a6858' },
};
const DEFAULT_INDOOR_FILL: NonNullable<typeof INDOOR_FILL[string]> = {
  position: [0, 2.2, 0], intensity: 1.6, color: '#998877', distance: 12,
};

/** Scene-specific point lights rendered from scene config */
function ScenePointLights() {
  const sceneId = useGameStore((s) => s.exploration.currentSceneId);
  const { preset } = useGraphicsQuality();
  const config = getSceneConfig(sceneId);
  const lights = config.lights ?? [];
  const heroLocalShadowScene =
    sceneId === 'volodka_room' ||
    sceneId === 'street_night' ||
    sceneId === 'city_square' ||
    sceneId === 'cafe_evening' ||
    sceneId === 'abandoned_factory';

  if (lights.length === 0) return null;

  return (
    <>
      {lights.map((light, i) => (
        <pointLight
          key={`scene-light-${sceneId}-${i}`}
          position={light.position}
          intensity={light.intensity * SCENE_VISIBILITY.pointLightScale}
          color={light.color}
          distance={light.distance}
          decay={2}
          castShadow={preset.shadows && heroLocalShadowScene && i < 2}
          shadow-mapSize-width={preset.id === 'ultra' ? 512 : 256}
          shadow-mapSize-height={preset.id === 'ultra' ? 512 : 256}
          shadow-bias={SHADOW_BIAS}
          shadow-normalBias={SHADOW_NORMAL_BIAS}
        />
      ))}
    </>
  );
}

/* ─── Dynamic time-of-day lighting for outdoor scenes ─── */
interface TimeOfDayLightingProps {
  sceneId: string;
  preset: import('@/engine/graphics/qualityPresets').QualityPreset;
  shadowSize: number;
  config: ReturnType<typeof getSceneConfig>;
}

export function TimeOfDayLighting({ sceneId, preset, shadowSize, config }: TimeOfDayLightingProps) {
  const hour = useTimeOfDay();
  const isMuted = MUTED_TOD_SCENES.has(sceneId);

  // Pre-allocate refs to avoid GC in frame loop
  const dirRef = useRef<THREE.DirectionalLight>(null!);
  const hemiRef = useRef<THREE.HemisphereLight>(null!);
  const ambRef = useRef<THREE.AmbientLight>(null!);
  const sunColor = useRef(new THREE.Color());
  const ambColor = useRef(new THREE.Color());
  const hemiSkyColor = useRef(new THREE.Color());
  const hemiGroundColor = useRef(new THREE.Color());

  // Working scratch colors for lerp (avoid alloc per frame)
  const scratchSun = useRef(new THREE.Color());
  const scratchAmb = useRef(new THREE.Color());
  const scratchHemiSky = useRef(new THREE.Color());
  const scratchHemiGround = useRef(new THREE.Color());

  // Current smoothed values (lerped toward target each frame)
  const curSunIntensity = useRef(0);
  const curAmbIntensity = useRef(0);
  const curHemiIntensity = useRef(0);
  const curSunPos = useRef<THREE.Vector3>(new THREE.Vector3());

  // Shadow frustum from scene dimensions
  const shadowHalfW = Math.max(15, (config.dimensions?.[0] ?? 15) * 0.6);
  const shadowHalfD = Math.max(15, (config.dimensions?.[2] ?? 15) * 0.6);

  const computeTarget = useCallback((h: number) => {
    const target = lerpKeyframes(h);
    const intensityMul = isMuted ? 0.4 : 1.0;

    // Lerp colors into scratch buffers using the same t from keyframe interpolation
    scratchSun.current.copy(target.sunColorA).lerp(target.sunColorB, target.t);
    scratchAmb.current.copy(target.ambientColorA).lerp(target.ambientColorB, target.t);
    scratchHemiSky.current.copy(target.hemiSkyColorA).lerp(target.hemiSkyColorB, target.t);
    scratchHemiGround.current.copy(target.hemiGroundColorA).lerp(target.hemiGroundColorB, target.t);

    return {
      sunIntensity: target.sunIntensity * intensityMul,
      sunPos: target.sunPosition,
      ambIntensity: target.ambientIntensity,
      hemiIntensity: target.hemiIntensity * SCENE_VISIBILITY.outdoorHemisphereMul,
    };
  }, [isMuted]);

  useFrameTick('misc', ({ delta }) => {
    const target = computeTarget(hour);
    const lerpFactor = 1 - Math.exp(-TOD_LERP_SPEED * delta);

    // Smooth interpolation of all values
    curSunIntensity.current += (target.sunIntensity - curSunIntensity.current) * lerpFactor;
    curAmbIntensity.current += (target.ambIntensity - curAmbIntensity.current) * lerpFactor;
    curHemiIntensity.current += (target.hemiIntensity - curHemiIntensity.current) * lerpFactor;
    curSunPos.current.set(target.sunPos[0], target.sunPos[1], target.sunPos[2]);

    // Smooth color interpolation
    sunColor.current.lerp(scratchSun.current, lerpFactor);
    ambColor.current.lerp(scratchAmb.current, lerpFactor);
    hemiSkyColor.current.lerp(scratchHemiSky.current, lerpFactor);
    hemiGroundColor.current.lerp(scratchHemiGround.current, lerpFactor);

    // Apply to light objects
    const dir = dirRef.current;
    if (dir) {
      dir.intensity = curSunIntensity.current;
      dir.color.copy(sunColor.current);
      dir.position.copy(curSunPos.current);
    }
    const hemi = hemiRef.current;
    if (hemi) {
      hemi.intensity = curHemiIntensity.current;
      hemi.color.copy(hemiSkyColor.current);
      hemi.groundColor.copy(hemiGroundColor.current);
    }
    const amb = ambRef.current;
    if (amb) {
      amb.intensity = curAmbIntensity.current * SCENE_VISIBILITY.ambientScale;
      amb.color.copy(ambColor.current);
    }
  });

  return (
    <>
      {/* Directional sun/moon light with shadows */}
      <directionalLight
        ref={dirRef}
        position={[5, 10, 5]}
        intensity={0.5}
        color="#ffffff"
        castShadow={preset.shadows}
        shadow-mapSize-width={preset.id === 'medium' ? 512 : shadowSize}
        shadow-mapSize-height={preset.id === 'medium' ? 512 : shadowSize}
        shadow-camera-near={0.1}
        shadow-camera-far={50}
        shadow-camera-left={-shadowHalfW}
        shadow-camera-right={shadowHalfW}
        shadow-camera-top={shadowHalfD}
        shadow-camera-bottom={-shadowHalfD}
        shadow-bias={SHADOW_BIAS}
        shadow-normalBias={SHADOW_NORMAL_BIAS}
      />

      {/* Hemisphere sky/ground fill */}
      <hemisphereLight
        ref={hemiRef}
        args={['#88aadd', '#446633', 0.5]}
      />

      {/* Time-of-day ambient fill */}
      <ambientLight
        ref={ambRef}
        intensity={0.5}
        color="#cccccc"
      />

      {/* Base readability ambient — prevents crushed blacks */}
      <ambientLight
        intensity={SCENE_VISIBILITY.baseAmbientIntensity}
        color="#4a5060"
      />
    </>
  );
}

/** Exploration lighting: directional + hemisphere + ambient + scene-specific lights */
export function ExplorationLighting() {
  const sceneId = useGameStore((s) => s.exploration.currentSceneId) as SceneId;
  const isMobile = useIsMobileVisual();
  const { preset, selectedPreset } = useGraphicsQuality();
  const { visualLite } = useMobileVisualPerf();
  const rendering = resolveSceneRenderingPipeline(
    sceneId,
    preset,
    visualLite,
    selectedPreset,
    isMobile,
  );
  const config = getSceneConfig(sceneId);
  const baseShadow = isMobile ? 512 : preset.id === 'ultra' ? 2048 : 1024;
  const shadowSize = Math.min(
    2048,
    Math.round(baseShadow * rendering.shadowMapScale),
  );
  const isIndoor = config.hasCeiling;

  // ── Outdoor scenes: use dynamic time-of-day lighting ──
  if (!isIndoor) {
    return (
      <>
        <TimeOfDayLighting
          sceneId={sceneId}
          preset={preset}
          shadowSize={shadowSize}
          config={config}
        />
        <ScenePointLights />
        <SceneAccentLights sceneId={sceneId} isMobile={isMobile} />
      </>
    );
  }

  // ── Indoor scenes: unchanged static lighting ──
  const ambientColor = config.ambientColor ?? '#1a1a2e';
  const ambientIntensity =
    (config.ambientIntensity ?? 1.2) * SCENE_VISIBILITY.ambientScale;
  const groundColor = config.groundColor ?? '#1a1a1a';

  const visualSceneId = resolveDerivedSceneId(sceneId);
  const isNight =
    sceneId === 'street_night'
    || sceneId === 'city_square'
    || sceneId === 'cafe_evening'
    || visualSceneId === 'river_pier';

  // Directional light — very dim indoors (barely-there ceiling bounce)
  // to let scene-specific point lights dominate the atmosphere
  const dirIntensity = 1.15;
  const dirColor = '#2a2540';
  const dirPosition: [number, number, number] = [2, 4, 2];

  // Indoor ambient — per-scene tuned (very low for noir rooms)
  const indoorAmb = INDOOR_AMBIENT[sceneId] ?? DEFAULT_INDOOR_AMBIENT;

  // Indoor fill — per-scene tuned or disabled
  const indoorFill = INDOOR_FILL[sceneId] ?? DEFAULT_INDOOR_FILL;

  // Scene-dimension-aware shadow camera frustum sizing
  const shadowHalfW = Math.max(15, (config.dimensions?.[0] ?? 15) * 0.6);
  const shadowHalfD = Math.max(15, (config.dimensions?.[2] ?? 15) * 0.6);

  return (
    <>
      {/* Main directional light with shadows */}
      <directionalLight
        position={dirPosition}
        intensity={dirIntensity}
        color={dirColor}
        castShadow={preset.shadows}
        shadow-mapSize-width={preset.id === 'medium' ? 512 : shadowSize}
        shadow-mapSize-height={preset.id === 'medium' ? 512 : shadowSize}
        shadow-camera-near={0.1}
        shadow-camera-far={50}
        shadow-camera-left={-shadowHalfW}
        shadow-camera-right={shadowHalfW}
        shadow-camera-top={shadowHalfD}
        shadow-camera-bottom={-shadowHalfD}
        shadow-bias={SHADOW_BIAS}
        shadow-normalBias={SHADOW_NORMAL_BIAS}
      />

      {/* Hemisphere light for ambient fill — reduced for indoor noir */}
      <hemisphereLight
        args={[
          ambientColor,
          groundColor,
          ambientIntensity * SCENE_VISIBILITY.indoorHemisphereMul,
        ]}
      />

      {/* Base readability fill — prevents crushed blacks in noir rooms */}
      <ambientLight
        intensity={SCENE_VISIBILITY.baseAmbientIntensity}
        color="#3a3548"
      />

      {/* Indoor ambient — per-scene tuned (very low for noir rooms like volodka_room) */}
      <ambientLight intensity={indoorAmb.intensity} color={indoorAmb.color} />

      {/* Indoor fill light — per-scene tuned */}
      <pointLight
        position={indoorFill.position}
        intensity={indoorFill.intensity}
        color={indoorFill.color}
        distance={indoorFill.distance}
        decay={2}
      />

      {/* Scene-specific point lights from config */}
      <ScenePointLights />

      {/* ── Enhanced scene-specific accent lights ── */}
      <SceneAccentLights sceneId={sceneId} isMobile={isMobile} />
    </>
  );
}

/* ─── Scene-specific accent lights ───
 *  Dramatic, per-scene accent point lights for atmosphere:
 *  - Neon color-cycling lights for street_night
 *  - Warm candlelight flicker for home_evening
 *  - Cold blue backlight for guild_mainframe
 *  - Orange industrial light for abandoned_factory
 *  - Personal warm lighting for volodka_room
 */

interface AccentLight {
  position: [number, number, number];
  color: string;
  intensity: number;
  distance: number;
  /** If true, this light animates (color cycle or flicker) */
  animated?: 'neon_cycle' | 'candle_flicker' | 'cold_pulse';
  /** Quality-gated local shadow for hero practicals only. */
  shadowCaster?: boolean;
}

const SCENE_ACCENT_LIGHTS: Record<string, AccentLight[]> = {
  street_night: [
    { position: [-6, 3, -2], color: '#d88a9c', intensity: 0.95, distance: 10, animated: 'neon_cycle' },
    { position: [5, 3, -3], color: '#8fb8b8', intensity: 0.9, distance: 9, animated: 'neon_cycle' },
    { position: [2, 2.5, 1], color: '#ffaa66', intensity: 1.15, distance: 8, shadowCaster: true },
    { position: [-3, 3.5, -5], color: '#9b86bc', intensity: 0.72, distance: 12, animated: 'neon_cycle' },
    { position: [7, 2.8, 0], color: '#8da8d8', intensity: 0.95, distance: 8, shadowCaster: true },
    { position: [-8, 3, 5], color: '#cf8f96', intensity: 0.82, distance: 10, animated: 'neon_cycle' },
  ],
  city_square: [
    { position: [-8, 3.4, -6], color: '#55e8dd', intensity: 0.95, distance: 14, animated: 'neon_cycle' },
    { position: [8, 3.2, 7], color: '#ff6688', intensity: 0.9, distance: 13, animated: 'neon_cycle' },
    { position: [0, 4.2, 0], color: '#aaccff', intensity: 1.15, distance: 16, shadowCaster: true },
    { position: [-5, 3.0, 5], color: '#9b86bc', intensity: 0.75, distance: 12, animated: 'neon_cycle' },
    { position: [6, 2.8, -4], color: '#ffaa66', intensity: 1.05, distance: 11, shadowCaster: true },
    { position: [-3, 3.6, -8], color: '#8fb8b8', intensity: 0.82, distance: 12, animated: 'cold_pulse' },
  ],
  home_evening: [
    { position: [0.5, 1.8, -0.5], color: '#ff9944', intensity: 2.0, distance: 8, animated: 'candle_flicker' },
    { position: [-1, 1.5, 1], color: '#ffbb66', intensity: 1.2, distance: 6, animated: 'candle_flicker' },
  ],
  cafe_evening: [
    { position: [-3, 2.5, -1], color: '#6688cc', intensity: 1.15, distance: 9, animated: 'cold_pulse', shadowCaster: true },
    { position: [2, 2.2, 2], color: '#5f74aa', intensity: 0.95, distance: 8, animated: 'cold_pulse' },
    { position: [0, 1.5, -3], color: '#ff9966', intensity: 1.0, distance: 6, shadowCaster: true },
  ],
  volodka_corridor: [
    { position: [0, 2.5, 0], color: '#ccaa55', intensity: 1.6, distance: 10, animated: 'candle_flicker' },
    { position: [0, 2.2, -6], color: '#3355aa', intensity: 1.2, distance: 8, animated: 'cold_pulse' },
    { position: [0, 2.2, 6], color: '#223388', intensity: 0.8, distance: 7, animated: 'cold_pulse' },
  ],
  office_day: [
    { position: [0, 2.6, -2], color: '#ccdde8', intensity: 1.2, distance: 14, animated: 'cold_pulse' },
    { position: [3, 2.5, 2], color: '#bbccdd', intensity: 0.8, distance: 12, animated: 'cold_pulse' },
    { position: [-3, 2.5, 2], color: '#aab8cc', intensity: 0.8, distance: 12, animated: 'cold_pulse' },
  ],
  library_day: [
    { position: [0, 1.8, -2], color: '#ddaa55', intensity: 1.5, distance: 8, animated: 'candle_flicker' },
    { position: [2, 2.2, 0], color: '#cc9944', intensity: 0.8, distance: 7, animated: 'candle_flicker' },
    { position: [-2.2, 2.0, 1.5], color: '#8899aa', intensity: 0.55, distance: 9, animated: 'cold_pulse' }, // window cool fill
  ],
  park_day: [
    { position: [2, 4, -1], color: '#ffdd88', intensity: 1.6, distance: 14 },
    { position: [-3, 3.5, 2], color: '#ffcc77', intensity: 1.2, distance: 12 },
    { position: [0, 2.5, -4], color: '#eebb66', intensity: 0.9, distance: 10 },
    { position: [-1.5, 1.8, 3], color: '#889988', intensity: 0.45, distance: 9, animated: 'cold_pulse' }, // canopy cool fill
  ],
  guild_mainframe: [
    { position: [-3, 2, -2], color: '#22aadd', intensity: 2.2, distance: 10, animated: 'cold_pulse' },
    { position: [3, 2, -4], color: '#44ddff', intensity: 2.0, distance: 9, animated: 'cold_pulse' },
    { position: [0, 3, 0], color: '#1188cc', intensity: 1.6, distance: 12 },
    { position: [0, 2.2, -5.2], color: '#00ffaa', intensity: 1.4, distance: 8, animated: 'cold_pulse' },
  ],
  abandoned_factory: [
    { position: [-2, 2.5, 2], color: '#ff8833', intensity: 2.4, distance: 12, animated: 'candle_flicker', shadowCaster: true },
    { position: [4, 2, -3], color: '#dd6622', intensity: 1.7, distance: 10, animated: 'candle_flicker' },
    { position: [0, 3, -4], color: '#ffaa44', intensity: 1.4, distance: 8, animated: 'candle_flicker' },
    { position: [-2, 1.8, -3.5], color: '#22aa66', intensity: 0.9, distance: 6, animated: 'cold_pulse' },
  ],
  volodka_room: [
    { position: [1.2, 1.4, -2.5], color: '#5a9a88', intensity: 0.95, distance: 5.5, animated: 'cold_pulse' },  // monitor phosphor (filmic, not candy)
    { position: [-0.5, 1.8, 0.5], color: '#ffcc88', intensity: 1.0, distance: 5, animated: 'candle_flicker', shadowCaster: true }, // bedside lamp
    { position: [0, 0.3, -2.5], color: '#ff9944', intensity: 0.35, distance: 3 },     // under-desk warm glow
    { position: [2.3, 0.2, 1.0], color: '#334488', intensity: 0.3, distance: 4 },    // floor-level cold bounce from window wall
  ],
  factory_basement: [
    { position: [0, 2.4, -5], color: '#22ff88', intensity: 2.0, distance: 10, shadowCaster: true }, // Zarya-M practical
    { position: [2, 2, -2], color: '#44ffaa', intensity: 1.2, distance: 7 },
    { position: [-2.5, 2.1, -3.5], color: '#33cc88', intensity: 0.85, distance: 6, animated: 'cold_pulse' },
    { position: [0, 0.4, -3.2], color: '#116644', intensity: 0.4, distance: 4 }, // floor bounce under monolith
  ],
  rooftop_edge: [
    { position: [-3, 3, 0], color: '#ff8844', intensity: 1.8, distance: 14, shadowCaster: true }, // sunset warm + ground contact
    { position: [4, 2.5, -2], color: '#ff6633', intensity: 1.4, distance: 12 },        // distant city reflection
    { position: [0, 2, 3], color: '#ffaa66', intensity: 1.0, distance: 10 },         // ambient warmth
  ],
  // factory_roof denser industrial spill (own row — does not fall through to rooftop_edge)
  factory_roof: [
    { position: [-3, 3, 0], color: '#ff7744', intensity: 1.9, distance: 14, shadowCaster: true },
    { position: [4, 2.5, -2], color: '#ff5522', intensity: 1.35, distance: 12 },
    { position: [0, 2, 3], color: '#ff9944', intensity: 1.05, distance: 10 },
    { position: [2, 1.2, -1], color: '#88aacc', intensity: 0.55, distance: 8, animated: 'cold_pulse' },
  ],
  river_pier: [
    { position: [0, 1.5, -1], color: '#ff9944', intensity: 2.0, distance: 8, animated: 'candle_flicker', shadowCaster: true },
    { position: [3, 2.5, 0], color: '#ffbb55', intensity: 1.25, distance: 11 },
    { position: [-2, 2, 1], color: '#ffcc66', intensity: 0.85, distance: 9 },
    { position: [5, 3.2, -8], color: '#8aa0c0', intensity: 0.7, distance: 14, animated: 'cold_pulse' },
    { position: [-4, 2.4, -3], color: '#ffaa66', intensity: 0.95, distance: 10, animated: 'candle_flicker' },
  ],
  // pier_evening inherits via resolveDerivedSceneId fallback in SceneAccentLights
  solnysh_room: [
    { position: [0, 1.6, 0], color: '#ffcc88', intensity: 1.5, distance: 7, animated: 'candle_flicker' },  // table lamp
    { position: [-1, 1.2, 1], color: '#ffbb77', intensity: 1.0, distance: 5, animated: 'candle_flicker' },  // corner lamp
  ],
  zarema_albert_room: [
    { position: [0, 2, -1], color: '#ffbb77', intensity: 1.4, distance: 8 },       // warm overhead
    { position: [1, 1.5, 1], color: '#ffaa55', intensity: 0.8, distance: 6, animated: 'candle_flicker' },  // desk lamp
  ],
  battle: [
    { position: [0, 3, 0], color: '#ff6633', intensity: 2.5, distance: 16, animated: 'candle_flicker' },   // central conflict glow
    { position: [-4, 2, -3], color: '#ff4422', intensity: 1.5, distance: 12 },      // peripheral danger
    { position: [5, 2.5, 2], color: '#ff8844', intensity: 1.2, distance: 10 },       // secondary accent
  ],
  street_winter: [
    { position: [-2, 3, -1], color: '#ccddff', intensity: 1.2, distance: 12 },      // cold moonlight
    { position: [3, 2.5, 0], color: '#aabbdd', intensity: 0.8, distance: 10 },       // snow-reflected fill
    { position: [0, 1.8, 2], color: '#ffddaa', intensity: 0.6, distance: 8 },        // distant window warmth
  ],
  chk_campfire_night: [
    { position: [0, 1.2, 0], color: '#ff8833', intensity: 2.5, distance: 8, animated: 'candle_flicker' },  // campfire
    { position: [0, 2.5, 0], color: '#ff6622', intensity: 1.2, distance: 14, animated: 'candle_flicker' },  // fire uplight
    { position: [2, 1.5, 1], color: '#ffaa44', intensity: 0.6, distance: 6 },        // peripheral warmth
  ],
  albert_backroom: [
    { position: [0, 2, -0.5], color: '#ddaa55', intensity: 1.4, distance: 8, animated: 'candle_flicker' }, // desk lamp
    { position: [-1, 1.5, 1], color: '#cc9944', intensity: 0.8, distance: 6 },       // ambient fill
    { position: [2.2, 1.8, 0], color: '#ff4499', intensity: 0.7, distance: 5, animated: 'neon_cycle' },
  ],
  underground_bunker: [
    { position: [0, 2.2, -4], color: '#44ff88', intensity: 1.8, distance: 11, animated: 'cold_pulse' },
    { position: [-4, 2.0, 2], color: '#ff5544', intensity: 1.1, distance: 9, animated: 'candle_flicker' },
    { position: [3.5, 1.8, 3], color: '#6688aa', intensity: 0.8, distance: 8 },
  ],
  sleep_dream: [
    { position: [0, 2, 0], color: '#aa66ff', intensity: 1.8, distance: 14, animated: 'cold_pulse' },    // dream pulse
    { position: [-3, 1.5, -2], color: '#8844dd', intensity: 1.2, distance: 10, animated: 'cold_pulse' },   // side dream glow
    { position: [2, 3, 1], color: '#cc88ff', intensity: 1.0, distance: 12, animated: 'cold_pulse' },     // floating orb
  ],
};

function SceneAccentLights({ sceneId, isMobile }: { sceneId: string; isMobile: boolean }) {
  const { preset } = useGraphicsQuality();
  // Variant scenes (pier_evening → river_pier, factory_roof → rooftop_edge, …)
  // share parent accents unless they define their own row.
  const lights =
    SCENE_ACCENT_LIGHTS[sceneId]
    ?? SCENE_ACCENT_LIGHTS[resolveDerivedSceneId(sceneId as SceneId)];
  if (!lights) return null;

  // On mobile, limit accent lights to prevent performance issues
  const effectiveLights = isMobile ? lights.slice(0, 2) : lights;

  return (
    <>
      {effectiveLights.map((light, i) => {
        const castShadow = preset.shadows && !isMobile && light.shadowCaster === true;
        if (light.animated) {
          return (
            <AnimatedAccentLight
              key={`accent-${sceneId}-${i}`}
              config={light}
              seed={i * 997}
              castShadow={castShadow}
            />
          );
        }
        return (
          <pointLight
            key={`accent-${sceneId}-${i}`}
            position={light.position}
            intensity={light.intensity}
            color={light.color}
            distance={light.distance}
            decay={2}
            castShadow={castShadow}
            shadow-mapSize-width={preset.id === 'ultra' ? 512 : 256}
            shadow-mapSize-height={preset.id === 'ultra' ? 512 : 256}
            shadow-bias={SHADOW_BIAS}
            shadow-normalBias={SHADOW_NORMAL_BIAS}
          />
        );
      })}
    </>
  );
}

/** Animated accent light with neon color cycling, candle flicker, or cold pulse */
function AnimatedAccentLight({ config, seed, castShadow }: { config: AccentLight; seed: number; castShadow: boolean }) {
  const lightRef = useRef<THREE.PointLight>(null);
  const timeRef = useRef(0);
  const baseColor = useMemo(() => new THREE.Color(config.color), [config.color]);

  useFrameTick('postfx', ({ delta }) => {
    if (!lightRef.current) return;
    timeRef.current += delta;
    const t = timeRef.current;

    switch (config.animated) {
      case 'neon_cycle': {
        // Slowly cycle hue while maintaining saturation and lightness
        const hueShift = (Math.sin(t * 0.15 + seed * 0.1) * 0.08);
        const hsl = { h: 0, s: 0, l: 0 };
        baseColor.getHSL(hsl);
        lightRef.current.color.setHSL(
          (hsl.h + hueShift + 1) % 1,
          hsl.s,
          hsl.l,
        );
        // Subtle intensity pulsing
        lightRef.current.intensity = config.intensity * (0.85 + 0.15 * Math.sin(t * 0.4 + seed));
        break;
      }
      case 'candle_flicker': {
        // Warm organic flicker — multiple sine waves at different frequencies
        const flicker =
          0.7
          + 0.15 * Math.sin(t * 3.7 + seed)
          + 0.1 * Math.sin(t * 7.3 + seed * 2)
          + 0.05 * Math.sin(t * 13.1 + seed * 3);
        lightRef.current.intensity = config.intensity * flicker;
        // Subtle color temperature shift (warmer when dimmer)
        const warmth = 1 - (flicker - 0.7) * 0.3;
        lightRef.current.color.setRGB(
          Math.min(1, baseColor.r * warmth * 1.1),
          Math.min(1, baseColor.g * warmth * 0.9),
          Math.min(1, baseColor.b * warmth * 0.7),
        );
        break;
      }
      case 'cold_pulse': {
        // Slow cold pulse — server room data flow feeling
        const pulse = 0.8 + 0.2 * Math.sin(t * 0.3 + seed);
        lightRef.current.intensity = config.intensity * pulse;
        // Slight color shift between blue-green and pure blue
        const blueShift = Math.sin(t * 0.2 + seed * 0.5) * 0.1;
        lightRef.current.color.setRGB(
          Math.max(0, baseColor.r - blueShift * 0.5),
          Math.max(0, baseColor.g + blueShift * 0.3),
          Math.min(1, baseColor.b + blueShift),
        );
        break;
      }
    }
  });

  return (
    <pointLight
      ref={lightRef}
      position={config.position}
      intensity={config.intensity}
      color={config.color}
      distance={config.distance}
      decay={2}
      castShadow={castShadow}
      shadow-mapSize-width={512}
      shadow-mapSize-height={512}
      shadow-bias={SHADOW_BIAS}
      shadow-normalBias={SHADOW_NORMAL_BIAS}
    />
  );
}
