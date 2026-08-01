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

export function getPolyHavenMapUrl(
  materialId: PolyHavenMaterialId,
  map: PolyHavenMapKind,
  textureScale: 0.25 | 0.5 | 1 = 1,
): string {
  const res = resolvePolyHavenRes(materialId, textureScale);
  // Fall back to 1k path if 2k not shipped for this material/map
  const useRes = HAS_2K[materialId] && res === '2k' ? '2k' : '1k';
  return `/textures/polyhaven/${materialId}/${materialId}_${map}_${useRes}.jpg`;
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

/** Photographic HDRIs under public/hdri (CC0 Poly Haven). */
export type PolyHavenHdriId = 'moonlit_golf_2k' | 'abandoned_parking_1k' | 'lebombo_1k';

export const POLYHAVEN_HDRI: Record<PolyHavenHdriId, string> = {
  moonlit_golf_2k: '/hdri/moonlit_golf_2k.hdr',
  abandoned_parking_1k: '/hdri/abandoned_parking_1k.hdr',
  lebombo_1k: '/hdri/lebombo_1k.hdr',
};

export function resolveHeroHdriPath(sceneId: string): string | null {
  switch (sceneId) {
    case 'street_night':
    case 'city_square':
    case 'cafe_evening':
      return POLYHAVEN_HDRI.moonlit_golf_2k;
    case 'street_winter':
    case 'rooftop_edge':
    case 'abandoned_factory':
      return POLYHAVEN_HDRI.abandoned_parking_1k;
    case 'volodka_room':
    case 'volodka_corridor':
    case 'home_evening':
    case 'solnysh_room':
    case 'zarema_albert_room':
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
  urbanFacade: '/models/polyhaven/modular_urban_apartments_facade/modular_urban_apartments_facade.gltf',
  fireEscape: '/models/polyhaven/modular_fire_escape/modular_fire_escape.gltf',
  roadBarrier: '/models/polyhaven/concrete_road_barrier/concrete_road_barrier.gltf',
  bench: '/models/polyhaven/painted_wooden_bench/painted_wooden_bench.gltf',
  industrialLamp: '/models/polyhaven/hanging_industrial_lamp/hanging_industrial_lamp.gltf',
  shutterWindow: '/models/polyhaven/rollershutter_window_01/rollershutter_window_01.gltf',
  barrel: '/models/polyhaven/Barrel_01/Barrel_01.gltf',
  cardboardBox: '/models/polyhaven/cardboard_box_01/cardboard_box_01_1k.gltf',
  metalTrashCan: '/models/polyhaven/metal_trash_can/metal_trash_can_1k.gltf',
  streetLamp: '/models/polyhaven/street_lamp_01/street_lamp_01_1k.gltf',
  trashbag: '/models/polyhaven/trashbag/trashbag_1k.gltf',
  wetFloorSign: '/models/polyhaven/WetFloorSign_01/WetFloorSign_01_1k.gltf',
  shutterDoor: '/models/polyhaven/rollershutter_door/rollershutter_door_1k.gltf',
  gothicStatue: '/models/polyhaven/gothic_statue/gothic_statue_2k.gltf',
  streetLampAlt: '/models/polyhaven/street_lamp_02/street_lamp_02_1k.gltf',
  roadBarrierAlt: '/models/polyhaven/concrete_road_barrier_02/concrete_road_barrier_02_1k.gltf',
  shutterWindowAlt: '/models/polyhaven/rollershutter_window_02/rollershutter_window_02_1k.gltf',
  exteriorAirconUnit: '/models/polyhaven/exterior_aircon_unit/exterior_aircon_unit_1k.gltf',
  powerBox: '/models/polyhaven/power_box_01/power_box_01_1k.gltf',
  securityCamera: '/models/polyhaven/security_camera_01/security_camera_01_1k.gltf',
  utilityBox: '/models/polyhaven/utility_box_01/utility_box_01_1k.gltf',
  oldTyre: '/models/polyhaven/old_tyre/old_tyre_1k.gltf',
  manholeCover: '/models/polyhaven/water_manhole_cover/water_manhole_cover_1k.gltf',
  woodenCrate: '/models/polyhaven/wooden_crate_01/wooden_crate_01_1k.gltf',
  armChair: '/models/polyhaven/ArmChair_01/ArmChair_01_2k.gltf',
  paintedWoodenTable: '/models/polyhaven/painted_wooden_table/painted_wooden_table_2k.gltf',
  paintedWoodenCabinet: '/models/polyhaven/painted_wooden_cabinet/painted_wooden_cabinet_2k.gltf',
  woodenBookshelfWorn: '/models/polyhaven/wooden_bookshelf_worn/wooden_bookshelf_worn_2k.gltf',
  deskLampArm: '/models/polyhaven/desk_lamp_arm_01/desk_lamp_arm_01_2k.gltf',
  sofa: '/models/polyhaven/sofa_02/sofa_02_2k.gltf',
  cassettePlayer: '/models/polyhaven/portable_cassette_player/portable_cassette_player_1k.gltf',
  gothicBed: '/models/polyhaven/GothicBed_01/GothicBed_01_1k.gltf',
  hangingPictureFrame: '/models/polyhaven/hanging_picture_frame_01/hanging_picture_frame_01_1k.gltf',
} as const;

export const POLYHAVEN_MENU_PLATE = '/menu/cinematic_night_plate.png';
