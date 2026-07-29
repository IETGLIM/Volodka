/** Core scene IDs — definitions live in sceneDefinitions.ts */
export const CORE_SCENE_IDS = [
  'volodka_room',
  'volodka_corridor',
  'home_evening',
  'street_night',
  'street_winter',
  'cafe_evening',
  'office_day',
  'park_day',
  'library_day',
  'battle',
  'sleep_dream',
  'rooftop_edge',
  'abandoned_factory',
  'zarema_albert_room',
  'solnysh_room',
  'chk_forest_zorge',
  'factory_basement',
  'river_pier',
] as const;

/** Extension scene IDs — definitions live in sceneExtensionDefinitions.ts */
export const EXTENSION_SCENE_IDS = [
  'chk_campfire_night',
  'pier_evening',
  'factory_roof',
  'library_basement',
  'city_square',
  'underground_bunker',
  'guild_mainframe',
  'zarema_room',
  'albert_backroom',
  'procedural_aaa',
] as const;

export type CoreSceneId = (typeof CORE_SCENE_IDS)[number];
export type ExtensionSceneId = (typeof EXTENSION_SCENE_IDS)[number];
export type SceneId = CoreSceneId | ExtensionSceneId;

/** Mutable runtime list — used by save validation and scene sanitization */
export const SCENE_IDS: SceneId[] = [...CORE_SCENE_IDS, ...EXTENSION_SCENE_IDS];
