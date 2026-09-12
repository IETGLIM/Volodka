/**
 * Poly Haven CC0 PBR texture catalog shipped under public/textures/polyhaven.
 * Credit: https://polyhaven.com — assets are CC0; API usage credited in ATTRIBUTION.
 */

export type PolyHavenMaterialId =
  | 'asphalt_02'
  | 'concrete_floor_painted'
  | 'wood_floor'
  | 'plastered_wall'
  | 'metal_plate';

export type PolyHavenMapKind = 'diff' | 'nor_gl' | 'rough' | 'ao';

export type PolyHavenRes = '1k' | '2k';

/** Канонические списки кросс-продукта (этап 133): prune/verify/тесты обязаны
 *  использовать их, а не собственные локальные копии (источник дрейфа keep-set). */
export const POLYHAVEN_MATERIAL_IDS: readonly PolyHavenMaterialId[] = [
  'asphalt_02',
  'concrete_floor_painted',
  'wood_floor',
  'plastered_wall',
  'metal_plate',
];

export const POLYHAVEN_MAP_KINDS: readonly PolyHavenMapKind[] = ['diff', 'nor_gl', 'rough', 'ao'];

export const POLYHAVEN_TEXTURE_SCALES = [0.25, 0.5, 1] as const;

const HAS_2K: Partial<Record<PolyHavenMaterialId, true>> = {
  asphalt_02: true,
  wood_floor: true,
};

export function resolvePolyHavenRes(
  materialId: PolyHavenMaterialId,
  textureScale: 0.25 | 0.5 | 1,
): PolyHavenRes {
  if (textureScale >= 1 && HAS_2K[materialId]) return '2k';
  return '1k';
}

/** Типы карт, для которых KTX2 одобрен ИЗМЕРЕНИЯМИ (см.
 *  scripts/generate-polyhaven-ktx2.mjs — шапка с PSNR/размерами):
 *  diff/rough/ao → basis-lz прозрачен (49.4 dB) и в 2-3× меньше WebP.
 *  nor_gl исключён: ETC1S 30.1 dB (блочность бликов), UASTC 8bpp-пол
 *  (5.1 MB на одну 2k) — нормали грузятся по WebP-пути. */
export const POLYHAVEN_KTX2_MAP_KINDS: ReadonlySet<PolyHavenMapKind> = new Set([
  'diff',
  'rough',
  'ao',
]);

/** Резолвер расширения: единая логика имени для KTX2 и WebP-фолбэка. */
function getPolyHavenMapUrlBase(
  materialId: PolyHavenMaterialId,
  map: PolyHavenMapKind,
  textureScale: 0.25 | 0.5 | 1,
  ext: 'ktx2' | 'webp',
): string {
  const res = resolvePolyHavenRes(materialId, textureScale);
  // Fall back to 1k path if 2k not shipped for this material/map
  const useRes = HAS_2K[materialId] && res === '2k' ? '2k' : '1k';
  return `/textures/polyhaven/${materialId}/${materialId}_${map}_${useRes}.${ext}`;
}

/** Этап 133: основной формат внешних карт — KTX2/Basis для diff/rough/ao
 *  (basis-lz, mip-цепочка); нормали остаются WebP (решение по измерениям).
 *  Генерация — `npm run assets:polyhaven-ktx2`
 *  (scripts/generate-polyhaven-ktx2.mjs). Роутинг загрузчика — по расширению
 *  URL (src/engine/assets/ktx2Textures.ts). */
export function getPolyHavenMapUrl(
  materialId: PolyHavenMaterialId,
  map: PolyHavenMapKind,
  textureScale: 0.25 | 0.5 | 1 = 1,
): string {
  const ext = POLYHAVEN_KTX2_MAP_KINDS.has(map) ? 'ktx2' : 'webp';
  return getPolyHavenMapUrlBase(materialId, map, textureScale, ext);
}

/** WebP-вариант той же карты — фолбэк при недоступности транскодера Basis
 *  (детектируется в рантайме и логируется в diagnostics). Для nor_gl
 *  совпадает с основным путём (нормали всегда WebP). STAGED ROLLOUT:
 *  WebP-фолбэк цветовых карт ОСТАЁТСЯ в deploy keep-set до первой браузерной
 *  QA KTX2-пути; после подтверждения — исключить из keep-set. */
export function getPolyHavenFallbackMapUrl(
  materialId: PolyHavenMaterialId,
  map: PolyHavenMapKind,
  textureScale: 0.25 | 0.5 | 1 = 1,
): string {
  return getPolyHavenMapUrlBase(materialId, map, textureScale, 'webp');
}

export interface PolyHavenPbrUrls {
  map: string;
  normalMap: string;
  roughnessMap: string;
  aoMap: string;
  repeat: number;
}

const DEFAULT_REPEAT: Record<PolyHavenMaterialId, number> = {
  asphalt_02: 8,
  concrete_floor_painted: 5,
  wood_floor: 3,
  plastered_wall: 2.5,
  metal_plate: 4,
};

export function getPolyHavenPbrUrls(
  materialId: PolyHavenMaterialId,
  textureScale: 0.25 | 0.5 | 1 = 1,
): PolyHavenPbrUrls {
  return {
    map: getPolyHavenMapUrl(materialId, 'diff', textureScale),
    normalMap: getPolyHavenMapUrl(materialId, 'nor_gl', textureScale),
    roughnessMap: getPolyHavenMapUrl(materialId, 'rough', textureScale),
    aoMap: getPolyHavenMapUrl(materialId, 'ao', textureScale),
    repeat: DEFAULT_REPEAT[materialId],
  };
}

/** WebP-вариант PBR-набора — используется только при сбое KTX2-пути
 *  (см. usePolyHavenPbr / loadPolyHavenPbrTextureSet). */
export function getPolyHavenFallbackPbrUrls(
  materialId: PolyHavenMaterialId,
  textureScale: 0.25 | 0.5 | 1 = 1,
): PolyHavenPbrUrls {
  return {
    map: getPolyHavenFallbackMapUrl(materialId, 'diff', textureScale),
    normalMap: getPolyHavenFallbackMapUrl(materialId, 'nor_gl', textureScale),
    roughnessMap: getPolyHavenFallbackMapUrl(materialId, 'rough', textureScale),
    aoMap: getPolyHavenFallbackMapUrl(materialId, 'ao', textureScale),
    repeat: DEFAULT_REPEAT[materialId],
  };
}

/** Photographic HDRIs under public/hdri (CC0 Poly Haven). */
export type PolyHavenHdriId = 'moonlit_golf_2k' | 'moonlit_golf_1k' | 'abandoned_parking_1k' | 'lebombo_1k';

export const POLYHAVEN_HDRI: Record<PolyHavenHdriId, string> = {
  moonlit_golf_2k: '/hdri/moonlit_golf_2k.hdr',
  // v4.7.3: box-2x downscale of moonlit_golf_2k (6.7→3.1 МБ) — for
  // low-tier devices (mobile / low memory); selected via resolveHeroHdriPath.
  moonlit_golf_1k: '/hdri/moonlit_golf_1k.hdr',
  abandoned_parking_1k: '/hdri/abandoned_parking_1k.hdr',
  lebombo_1k: '/hdri/lebombo_1k.hdr',
};

export function resolveHeroHdriPath(sceneId: string, options?: { lowMemory?: boolean }): string | null {
  switch (sceneId) {
    case 'street_night':
    case 'city_square':
    case 'cafe_evening':
      return options?.lowMemory
        ? POLYHAVEN_HDRI.moonlit_golf_1k
        : POLYHAVEN_HDRI.moonlit_golf_2k;
    case 'street_winter':
    case 'rooftop_edge':
    case 'abandoned_factory':
      return POLYHAVEN_HDRI.abandoned_parking_1k;
    // Apartment / interior scenes intentionally return null here. Poly Haven's
    // LEBOMBO is a South African nature grassland HDRI — sampling it as IBL
    // tinted every apartment surface with green-grass light. Returning null
    // falls through to BakedOrPresetFallback → resolveHeroEnvKind → the
    // authored `warm_apartment` PMREM bake (warm amber lamp + monitor glow).
    // Library/office scenes keep lebombo as a cooler neutral env (their
    // resolveHeroEnvKind default 'cool_lobby' would otherwise dominate).
    case 'library_day':
    case 'office_day':
      return POLYHAVEN_HDRI.lebombo_1k;
    default:
      return null;
  }
}

/** Outdoor heroes that should show the photographic HDRI as the sky (not a synthwave dome). */
export function usesPhotographicHdriBackground(sceneId: string): boolean {
  switch (sceneId) {
    case 'street_night':
    case 'street_winter':
    case 'city_square':
    case 'rooftop_edge':
    case 'abandoned_factory':
      return resolveHeroHdriPath(sceneId) != null;
    default:
      return false;
  }
}

/** Local Poly Haven glTF props/facades under public/models/polyhaven. */
export const POLYHAVEN_MODELS = {
  urbanFacade: '/models/polyhaven/modular_urban_apartments_facade/modular_urban_apartments_facade.glb',
  fireEscape: '/models/polyhaven/modular_fire_escape/modular_fire_escape.glb',
  roadBarrier: '/models/polyhaven/concrete_road_barrier/concrete_road_barrier.glb',
  bench: '/models/polyhaven/painted_wooden_bench/painted_wooden_bench.glb',
  industrialLamp: '/models/polyhaven/hanging_industrial_lamp/hanging_industrial_lamp.glb',
  shutterWindow: '/models/polyhaven/rollershutter_window_01/rollershutter_window_01.glb',
  barrel: '/models/polyhaven/Barrel_01/Barrel_01.glb',
  cardboardBox: '/models/polyhaven/cardboard_box_01/cardboard_box_01_1k.glb',
  metalTrashCan: '/models/polyhaven/metal_trash_can/metal_trash_can_1k.glb',
  streetLamp: '/models/polyhaven/street_lamp_01/street_lamp_01_1k.glb',
  trashbag: '/models/polyhaven/trashbag/trashbag_1k.glb',
  wetFloorSign: '/models/polyhaven/WetFloorSign_01/WetFloorSign_01_1k.glb',
  shutterDoor: '/models/polyhaven/rollershutter_door/rollershutter_door_1k.glb',
  gothicStatue: '/models/polyhaven/gothic_statue/gothic_statue_2k.glb',
  streetLampAlt: '/models/polyhaven/street_lamp_02/street_lamp_02_1k.glb',
  roadBarrierAlt: '/models/polyhaven/concrete_road_barrier_02/concrete_road_barrier_02_1k.glb',
  shutterWindowAlt: '/models/polyhaven/rollershutter_window_02/rollershutter_window_02_1k.glb',
  exteriorAirconUnit: '/models/polyhaven/exterior_aircon_unit/exterior_aircon_unit_1k.glb',
  powerBox: '/models/polyhaven/power_box_01/power_box_01_1k.glb',
  securityCamera: '/models/polyhaven/security_camera_01/security_camera_01_1k.glb',
  utilityBox: '/models/polyhaven/utility_box_01/utility_box_01_1k.glb',
  oldTyre: '/models/polyhaven/old_tyre/old_tyre_1k.glb',
  manholeCover: '/models/polyhaven/water_manhole_cover/water_manhole_cover_1k.glb',
  woodenCrate: '/models/polyhaven/wooden_crate_01/wooden_crate_01_1k.glb',
  armChair: '/models/polyhaven/ArmChair_01/ArmChair_01_2k.glb',
  paintedWoodenTable: '/models/polyhaven/painted_wooden_table/painted_wooden_table_2k.glb',
  paintedWoodenCabinet: '/models/polyhaven/painted_wooden_cabinet/painted_wooden_cabinet_2k.glb',
  woodenBookshelfWorn: '/models/polyhaven/wooden_bookshelf_worn/wooden_bookshelf_worn_2k.glb',
  deskLampArm: '/models/polyhaven/desk_lamp_arm_01/desk_lamp_arm_01_2k.glb',
  sofa: '/models/polyhaven/sofa_02/sofa_02_2k.glb',
  cassettePlayer: '/models/polyhaven/portable_cassette_player/portable_cassette_player_1k.glb',
  gothicBed: '/models/polyhaven/GothicBed_01/GothicBed_01_1k.glb',
  hangingPictureFrame: '/models/polyhaven/hanging_picture_frame_01/hanging_picture_frame_01_1k.glb',
} as const;

/* Этап 125: ночной кинематографический план меню конвертирован PNG → WebP (q90).
 * 1 218 655 B → 170 576 B (−86%); визуальная разница на градиентах ночного неба отсутствует. */
export const POLYHAVEN_MENU_PLATE = '/menu/cinematic_night_plate.webp';
