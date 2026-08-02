import type { SceneId } from '@/config/sceneDefinitions';
import { resolveDerivedSceneId } from '@/config/sceneInheritance';
import type { LocationCategory } from '@/shared/types/locationCategory';

/** Explicit location category per scene — designers override here or on SceneDefinition. */
export const SCENE_LOCATION_CATEGORIES = {
  volodka_room: 'home',
  volodka_corridor: 'corridor',
  home_evening: 'home',
  street_night: 'street',
  street_winter: 'street',
  cafe_evening: 'cafe',
  office_day: 'office',
  park_day: 'park',
  library_day: 'library',
  battle: 'unknown',
  sleep_dream: 'unknown',
  rooftop_edge: 'rooftop',
  abandoned_factory: 'factory',
  zarema_albert_room: 'home',
  solnysh_room: 'home',
  chk_forest_zorge: 'unknown',
  factory_basement: 'factory',
  river_pier: 'unknown',
  chk_campfire_night: 'unknown',
  pier_evening: 'unknown',
  factory_roof: 'rooftop',
  library_basement: 'library',
  city_square: 'street',
  underground_bunker: 'factory',
  guild_mainframe: 'office',
  zarema_room: 'home',
  albert_backroom: 'cafe',
  procedural_aaa: 'street',
  forest_clearing: 'park',
} as const satisfies Record<SceneId, LocationCategory>;

export const DEFAULT_SCENE_LOCATION_CATEGORY: LocationCategory = 'unknown';

export function getSceneLocationCategory(sceneId: SceneId): LocationCategory {
  const root = resolveDerivedSceneId(sceneId);
  return SCENE_LOCATION_CATEGORIES[root] ?? DEFAULT_SCENE_LOCATION_CATEGORY;
}
