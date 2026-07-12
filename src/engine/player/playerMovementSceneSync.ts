import {
  getSceneConfig,
  getExplorationLocomotionScale,
  getExplorationMovementTuning,
} from '@/config/scenes';
import type { SceneId } from '@/shared/types/game';
import type { PlayerMovementDeps } from '@/engine/player/playerFrameTypes';

/** Apply scene-scoped movement fields synchronously (before the next physics tick). */
export function syncMovementSceneContext(
  deps: PlayerMovementDeps,
  sceneId: SceneId,
  movementEpoch: number,
): void {
  deps.movementEpoch = movementEpoch;
  deps.sceneId = sceneId;
  deps.config = getSceneConfig(sceneId);
  deps.locomotionScale = getExplorationLocomotionScale(sceneId);
  deps.movementTuning = getExplorationMovementTuning(sceneId);
}

export function isMovementEpochStale(
  deps: PlayerMovementDeps,
  currentEpoch: number,
): boolean {
  return deps.movementEpoch !== currentEpoch;
}
