import type { SceneId } from '@/config/sceneDefinitions';

/**
 * Variant scenes reuse visuals/audio/weather from a parent scene.
 * Keeps Record<SceneId, …> registries maintainable when adding location variants.
 *
 * Chunk: boot-shared (vite/chunks.ts) — leaf used by scenes.ts (narrative) and
 * AudioEngine (combat); colocating either side alone recreates combat ↔ narrative TDZ.
 *
 * Sprint E/F: city_square / underground_bunker / guild_mainframe /
 * library_basement / albert_backroom / procedural_aaa have dedicated visuals — they are
 * intentionally absent here (own GPU chunk + VisualScene case).
 */
export const SCENE_DERIVED_FROM: Partial<Record<SceneId, SceneId>> = {
  chk_campfire_night: 'chk_forest_zorge',
  // FIX S13-14: forest_clearing is a standalone extension scene (own dimensions,
  // spawn, doorways) but shares ChkForestVisual + audio/weather registries with
  // chk_forest_zorge. Without this entry, resolveDerivedSceneId('forest_clearing')
  // returned 'forest_clearing' (no parent) → missing from VISUAL_SCENE_ROOTS,
  // WORLD_LOCATIONS, SCENE_AUDIO_PROFILES → 7 invariant/registry test failures.
  forest_clearing: 'chk_forest_zorge',
  pier_evening: 'river_pier',
  factory_roof: 'rooftop_edge',
  zarema_room: 'zarema_albert_room',
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
  library_basement: 'library_day',
  albert_backroom: 'cafe_evening',
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
