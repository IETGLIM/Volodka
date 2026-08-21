import type { SceneId } from '@/shared/types/game';

import { devWarn } from '@/shared/utils/devLog';
export type SceneTransitionRequest = (
  targetScene: SceneId,
  spawnAt?: [number, number, number],
) => void;

let requestTransition: SceneTransitionRequest | null = null;
/** Queue transitions that arrive before bind — flushed once bound */
let pendingTransition: { targetScene: SceneId; spawnAt?: [number, number, number] } | null = null;

export function bindSceneTransitionBridge(fn: SceneTransitionRequest): void {
  requestTransition = fn;
  // Flush any transition that was queued before the bridge was bound
  if (pendingTransition) {
    const { targetScene, spawnAt } = pendingTransition;
    pendingTransition = null;
    fn(targetScene, spawnAt);
  }
}

export function requestSceneTransitionFromBridge(
  targetScene: SceneId,
  spawnAt?: [number, number, number],
): void {
  if (!requestTransition) {
    // Queue the transition instead of silently dropping — it will fire once bound
    pendingTransition = { targetScene, spawnAt };
    if (import.meta.env?.DEV) {
      devWarn('[SceneTransitionBridge] request before bind — queued:', targetScene);
    }
    return;
  }
  requestTransition(targetScene, spawnAt);
}

/** Test helper */
export function resetSceneTransitionBridgeForTests(): void {
  requestTransition = null;
  pendingTransition = null;
}
