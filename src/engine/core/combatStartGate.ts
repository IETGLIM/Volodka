/**
 * Defers combat start while performSceneTransition is in flight.
 * Prevents combat audio / 3D models from racing scene unload → enter.
 */

import { getGameSnapshot } from '@/engine/GameActionDispatcher';
import type { EnemyType, SceneId } from '@/shared/types/game';
import { isSceneTransitionInProgress } from './SceneTransitionManager';

export interface DeferredCombatStartOptions {
  encounterName?: string;
}

interface PendingCombatStart {
  enemyType: EnemyType;
  options?: DeferredCombatStartOptions;
  sceneId: SceneId;
}

type CombatStartExecutor = (
  enemyType: EnemyType,
  options?: DeferredCombatStartOptions,
) => void;

let pending: PendingCombatStart | null = null;
let executor: CombatStartExecutor | null = null;

export function registerCombatStartExecutor(fn: CombatStartExecutor): void {
  executor = fn;
}

/** Queue combat until the scene transition pipeline finishes. */
export function deferCombatStartIfTransitionBusy(
  enemyType: EnemyType,
  options?: DeferredCombatStartOptions,
): boolean {
  if (!isSceneTransitionInProgress()) return false;

  pending = {
    enemyType,
    options,
    sceneId: getGameSnapshot().exploration.currentSceneId,
  };

  if (import.meta.env.DEV) {
    console.warn(
      '[CombatStartGate] Deferred combat until scene transition completes',
      { enemyType, sceneId: pending.sceneId },
    );
  }
  return true;
}

/** Run deferred combat after scene:loaded (first composited frame). */
export function flushDeferredCombatStart(): void {
  const req = pending;
  pending = null;
  if (!req || !executor) return;

  const currentSceneId = getGameSnapshot().exploration.currentSceneId;
  if (currentSceneId !== req.sceneId) {
    if (import.meta.env.DEV) {
      console.warn(
        '[CombatStartGate] Dropped deferred combat — scene changed',
        req.sceneId,
        '→',
        currentSceneId,
      );
    }
    return;
  }

  executor(req.enemyType, req.options);
}

export function clearDeferredCombatStart(): void {
  pending = null;
}

/** Test harness */
export function resetCombatStartGate(): void {
  pending = null;
}
