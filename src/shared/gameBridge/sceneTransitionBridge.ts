import type { SceneId } from '@/shared/types/game';

export type SceneTransitionRequest = (
  targetScene: SceneId,
  spawnAt?: [number, number, number],
) => void;

let requestTransition: SceneTransitionRequest | null = null;

export function bindSceneTransitionBridge(fn: SceneTransitionRequest): void {
  requestTransition = fn;
}

export function requestSceneTransitionFromBridge(
  targetScene: SceneId,
  spawnAt?: [number, number, number],
): void {
  if (!requestTransition) {
    if (import.meta.env?.DEV) {
      console.warn('[SceneTransitionBridge] request before bind — dropped:', targetScene);
    }
    return;
  }
  requestTransition(targetScene, spawnAt);
}

/** Test helper */
export function resetSceneTransitionBridgeForTests(): void {
  requestTransition = null;
}
