import type { SceneId } from '@/shared/types/game';

import { devWarn } from '@/shared/utils/devLog';
type SpawnTuple = [number, number, number];

/** Engine callbacks invoked from store slices — bound at bootstrap. */
export interface StoreEngineHost {
  requestSceneTransition(targetScene: SceneId, spawnAt?: SpawnTuple): void;
  resetGuidedStoryManager(): void;
  resetEngineModuleRuntimeState(): void;
  canStartQuest(questId: string): boolean;
  /** Engine-side interaction lock check — true while Approach/Cutscene/Align/Lock/Dialogue. */
  isInteractionLocked(): boolean;
  /** Cancel any in-flight scene:loaded payload (used by loadGame to avoid stale scene events). */
  resetSceneLoadedGate(): void;
}

let host: StoreEngineHost | null = null;

export function bindStoreEngineHost(next: StoreEngineHost): void {
  host = next;
}

export function requestSceneTransitionFromStore(
  targetScene: SceneId,
  spawnAt?: SpawnTuple,
): void {
  if (!host) {
    if (import.meta.env?.DEV) {
      devWarn('[StoreEngineHost] requestSceneTransition before bind — dropped:', targetScene);
    }
    return;
  }
  host.requestSceneTransition(targetScene, spawnAt);
}

export function resetGuidedStoryFromStore(): void {
  host?.resetGuidedStoryManager();
}

export function resetEngineRuntimeFromStore(): void {
  host?.resetEngineModuleRuntimeState();
}

export function canStartQuestFromEngine(questId: string): boolean {
  return host?.canStartQuest(questId) ?? false;
}

export function isInteractionLockedFromStore(): boolean {
  return host?.isInteractionLocked() ?? false;
}

export function resetSceneLoadedGateFromStore(): void {
  host?.resetSceneLoadedGate();
}

/** Test helper — reset host between unit tests. */
export function resetStoreEngineHostForTests(): void {
  host = null;
}
