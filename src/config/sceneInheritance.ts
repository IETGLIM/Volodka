import type { SceneId } from '@/config/sceneDefinitions';

/**
 * Variant scenes reuse visuals/audio/weather from a parent scene.
 * Keeps Record<SceneId, …> registries maintainable when adding location variants.
 *
 * Sprint E: city_square / underground_bunker / guild_mainframe have dedicated
 * visuals — they are intentionally absent here (own GPU chunk + VisualScene case).
 */
export const SCENE_DERIVED_FROM: Partial<Record<SceneId, SceneId>> = {
  chk_campfire_night: 'chk_forest_zorge',
  pier_evening: 'river_pier',
  factory_roof: 'rooftop_edge',
  library_basement: 'library_day',
  zarema_room: 'zarema_albert_room',
  albert_backroom: 'cafe_evening',
};

/**
 * Schedule/NPC inheritance — broader than visual derivation so dedicated-visual
 * extension rooms still pull parent street/office/basement spawn tables.
 */
export const SCENE_SCHEDULE_PARENT: Partial<Record<SceneId, SceneId>> = {
  ...SCENE_DERIVED_FROM,
  city_square: 'street_night',
  underground_bunker: 'factory_basement',
  guild_mainframe: 'office_day',
};

/** Resolve scene variant to its root parent for shared registries. */
export function resolveDerivedSceneId(sceneId: SceneId): SceneId {
  let current: SceneId = sceneId;
  const visited = new Set<SceneId>();
  while (true) {
    const parent = SCENE_DERIVED_FROM[current];
    if (!parent || visited.has(current)) break;
    visited.add(current);
    current = parent;
  }
  return current;
}

/** Whether an NPC schedule entry applies to the active scene (variant or parent). */
export function sceneMatchesScheduleEntry(querySceneId: SceneId, entrySceneId: SceneId): boolean {
  if (querySceneId === entrySceneId) return true;
  const parent = SCENE_SCHEDULE_PARENT[querySceneId];
  return parent !== undefined && parent === entrySceneId;
}
