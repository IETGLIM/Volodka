/* ─── Story flag gates for scene access (fast travel, map) ─── */

import type { SceneId } from '@/shared/types/game';

/** Simple single-flag gates (most locations). */
export const SCENE_FLAG_GATES: Partial<Record<SceneId, string>> = {
  rooftop_edge: 'rooftop_unlocked',
  abandoned_factory: 'factory_unlocked',
  river_pier: 'visited_river_pier',
  factory_basement: 'entered_factory_basement',
};

/** Whether the player has unlocked travel/access to a gated scene. */
export function isSceneGateOpen(
  sceneId: SceneId,
  flags: Record<string, boolean | undefined>,
): boolean {
  if (sceneId === 'chk_forest_zorge') {
    return flags.chk_forest_unlocked === true || flags.chk_path_known === true;
  }
  const gate = SCENE_FLAG_GATES[sceneId];
  if (!gate) return true;
  return flags[gate] === true;
}
