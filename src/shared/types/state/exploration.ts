/* ─── Exploration runtime state ─── */

import type { SceneId } from '@/config/sceneDefinitions';

export interface ExplorationState {
  currentSceneId: SceneId;
  playerPosition: [number, number, number];
  playerRotation: number;
  timeOfDay: number;
  npcStates: Record<string, { position: [number, number, number]; sceneId: SceneId }>;
  /** Monotonic accumulator of in-game hours elapsed since new game.
   *  Unlike `timeOfDay` (wraps 0..24), this counter never wraps and is used
   *  for cooldowns that span multiple in-game days (e.g. restAtHome cooldown
   *  after fix #2). Optional with default for save migration. */
  totalGameHours: number;
}
