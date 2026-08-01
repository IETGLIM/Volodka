/* ─── Volodka RPG – Poem-Gated Thought Acquisition ─── */
/* Watches for poem:collected events and auto-acquires thoughts
 * that have requiredPoem or minCollectedPoems gates. */

import { eventBus } from '@/engine/EventBus';
import { dispatchGameAction, getGameSnapshot } from '@/shared/gameBridge/gameActionBridge';
import { THOUGHT_CABINET_ITEMS } from '@/data/thoughtCabinet';
import { registerHmrDispose } from '@/shared/dev/hmrDispose';

let unsubscribe: (() => void) | null = null;

/**
 * Check all poem-gated thought cabinet items and acquire any
 * whose gate conditions are now met.
 */
export function checkAndAcquirePoemGatedThoughts(): void {
  const snapshot = getGameSnapshot();
  const collectedPoems = snapshot.collectedPoems;
  const collectedSet = new Set(collectedPoems);
  const acquiredSet = new Set(snapshot.acquiredThoughtIds);

  for (const thought of THOUGHT_CABINET_ITEMS) {
    // Skip thoughts that have no poem gate
    if (thought.requiredPoem === undefined && thought.minCollectedPoems === undefined) {
      continue;
    }
    // Skip already acquired
    if (acquiredSet.has(thought.id)) {
      continue;
    }

    let gateMet = true;

    if (thought.requiredPoem !== undefined) {
      if (!collectedSet.has(thought.requiredPoem)) {
        gateMet = false;
      }
    }

    if (thought.minCollectedPoems !== undefined) {
      if (collectedPoems.length < thought.minCollectedPoems) {
        gateMet = false;
      }
    }

    if (gateMet) {
      dispatchGameAction({ type: 'thoughtCabinet/acquire', thoughtId: thought.id });
    }
  }
}

/**
 * Subscribe to poem:collected events and trigger poem-gated
 * thought acquisition checks.
 *
 * @returns Cleanup function to unsubscribe.
 */
export function initPoemGatedThoughtWatcher(): () => void {
  unsubscribe?.();
  unsubscribe = eventBus.on('poem:collected', () => {
    // Defer to next microtask so the store has time to process
    // the world/collectPoem action dispatched by the poem pipeline.
    queueMicrotask(() => {
      try {
        checkAndAcquirePoemGatedThoughts();
      } catch {
        // Silently fail — non-critical feature
      }
    });
  });

  return destroyPoemGatedThoughtWatcher;
}

export function destroyPoemGatedThoughtWatcher(): void {
  unsubscribe?.();
  unsubscribe = null;
}

registerHmrDispose(destroyPoemGatedThoughtWatcher);
