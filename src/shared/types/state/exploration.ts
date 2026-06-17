/* ─── Exploration runtime state ─── */

import type { SceneId } from '@/config/sceneDefinitions';

export interface ExplorationState {
  currentSceneId: SceneId;
  playerPosition: [number, number, number];
  playerRotation: number;
  timeOfDay: number;
  npcStates: Record<string, { position: [number, number, number]; sceneId: SceneId }>;
}
