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

/**
 * [roadmap:ARCH-04] Previously held ONE pending combat — second deferred
 * combat silently overwrote the first. Now holds a queue (array) so all
 * deferred combats flush in order after scene:loaded. Only the LAST combat's
 * sceneId is checked for invalidation (a scene change invalidates all pending).
 */
let pendingQueue: PendingCombatStart[] = [];
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

  const entry: PendingCombatStart = {
    enemyType,
    options,
    sceneId: getGameSnapshot().exploration.currentSceneId,
  };
  pendingQueue.push(entry);

  if (timeoutHandler) {
    armDeferredCombatStartTimeout(timeoutHandler, COMBAT_START_GATE_TIMEOUT_MS);
  }

  if (import.meta.env.DEV) {
    console.warn(
      '[CombatStartGate] Deferred combat until scene transition completes',
      { enemyType, sceneId: entry.sceneId, queueLength: pendingQueue.length },
    );
  }
  return true;
}

/** Run deferred combat after scene:loaded (first composited frame). */
export function flushDeferredCombatStart(): void {
  clearPendingCombatTimeout();
  const queue = pendingQueue;
  pendingQueue = [];
  if (queue.length === 0 || !executor) return;

  const currentSceneId = getGameSnapshot().exploration.currentSceneId;

  // [roadmap:ARCH-04] Invalidate ALL pending combats if scene changed.
  // A scene change during transition means the combat context is stale.
  const validEntries = queue.filter((req) => req.sceneId === currentSceneId);
  const droppedCount = queue.length - validEntries.length;

  if (droppedCount > 0 && import.meta.env.DEV) {
    console.warn(
      `[CombatStartGate] Dropped ${droppedCount} deferred combat(s) — scene changed`,
      queue[0].sceneId,
      '→',
      currentSceneId,
    );
  }

  // [roadmap:ARCH-04] Only the LAST valid combat starts — the player can
  // only be in one combat at a time. Earlier deferred requests are dropped
  // (they were queued during the same transition; the last one is the most
  // recent intent). This mirrors CombatSystem.startCombat's idempotency
  // without requiring callers to check combat status.
  const lastValid = validEntries[validEntries.length - 1];
  if (lastValid) {
    executor(lastValid.enemyType, lastValid.options);
  }
}

export function clearDeferredCombatStart(): void {
  clearPendingCombatTimeout();
  pendingQueue = [];
}

/** Test harness */
export function resetCombatStartGate(): void {
  clearPendingCombatTimeout();
  pendingQueue = [];
}
