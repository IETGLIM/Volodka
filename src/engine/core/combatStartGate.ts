/**
 * Defers combat start while performSceneTransition is in flight.
 * Prevents combat audio / 3D models from racing scene unload → enter.
 */

import { getGameSnapshot } from '@/engine/GameActionDispatcher';
import type { EncounterSource } from '@/engine/combat/encounterTypes';
import type { EnemyType, SceneId } from '@/shared/types/game';
import { isSceneTransitionInProgress } from './sceneTransitionGuard';

export interface DeferredCombatStartOptions {
  encounterName?: string;
  encounterSource?: EncounterSource;
  creepId?: string;
}

/** Max wait for scene:loaded before flushing deferred combat / clearing async guard. */
export const COMBAT_START_GATE_TIMEOUT_MS = 15_000;

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
let pendingTimeoutId: ReturnType<typeof setTimeout> | null = null;
let timeoutHandler: (() => void) | null = null;

export function registerCombatStartGateTimeoutHandler(handler: () => void): void {
  timeoutHandler = handler;
}

function clearPendingCombatTimeout(): void {
  if (pendingTimeoutId !== null) {
    clearTimeout(pendingTimeoutId);
    pendingTimeoutId = null;
  }
}

export function armDeferredCombatStartTimeout(
  onTimeout: () => void,
  timeoutMs: number = COMBAT_START_GATE_TIMEOUT_MS,
): void {
  clearPendingCombatTimeout();
  pendingTimeoutId = setTimeout(() => {
    pendingTimeoutId = null;
    onTimeout();
  }, timeoutMs);
}

export function clearDeferredCombatStartTimeout(): void {
  clearPendingCombatTimeout();
}

export function registerCombatStartExecutor(fn: CombatStartExecutor): void {
  executor = fn;
}

/** Queue combat until the scene transition pipeline finishes. */
export function deferCombatStartIfTransitionBusy(
  enemyType: EnemyType,
  options?: DeferredCombatStartOptions,
): boolean {
  if (!isSceneTransitionInProgress()) return false;

  if (pending) {
    if (import.meta.env.DEV) {
      console.warn(
        '[CombatStartGate] Ignored duplicate deferral — transition already has pending combat',
        { existing: pending.enemyType, incoming: enemyType },
      );
    }
    return true;
  }

  pending = {
    enemyType,
    options,
    sceneId: getGameSnapshot().exploration.currentSceneId,
  };

  if (timeoutHandler) {
    armDeferredCombatStartTimeout(timeoutHandler, COMBAT_START_GATE_TIMEOUT_MS);
  }

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
  clearPendingCombatTimeout();
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
  clearPendingCombatTimeout();
  pending = null;
}

/** Test harness */
export function resetCombatStartGate(): void {
  clearPendingCombatTimeout();
  pending = null;
}
