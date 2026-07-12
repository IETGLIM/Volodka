import { eventBus } from '@/engine/EventBus';
import { getInteractionState, isInteractionLocked } from '@/engine/interaction/interactionSession';
import { InteractionState } from '@/engine/interaction/interactionMachine';
import { registerHmrDispose } from '@/shared/dev/hmrDispose';

/**
 * Monotonic id for the current "interaction end" cycle.
 * Incremented when a new staged interaction or narrative overlay session begins.
 * Dedup tracks which cycle already emitted interaction:end — not a bare boolean,
 * so a second dialogue (even without interaction:start) gets its own cycle.
 */
let interactionEndCycleId = 0;
let endEmittedForCycleId = -1;

/** Start a new interaction:end dedup cycle (new NPC approach or narrative overlay). */
export function beginInteractionEndCycle(): void {
  interactionEndCycleId += 1;
}

/** @deprecated Prefer beginInteractionEndCycle — kept for existing call sites. */
export function resetInteractionEndDedup(): void {
  beginInteractionEndCycle();
}

export function getInteractionEndCycleId(): number {
  return interactionEndCycleId;
}

/** Whether interaction:end was already emitted for the current cycle. */
export function wasInteractionEndEmitted(): boolean {
  return endEmittedForCycleId === interactionEndCycleId;
}

/**
 * Emit interaction:end at most once per cycle while interaction is active.
 * Returns true when the event was emitted.
 */
export function emitInteractionEndIfNeeded(): boolean {
  if (endEmittedForCycleId === interactionEndCycleId) return false;

  const interactionState = getInteractionState();
  if (interactionState === InteractionState.Idle && !isInteractionLocked()) {
    return false;
  }

  endEmittedForCycleId = interactionEndCycleId;
  eventBus.emit('interaction:end', {});
  return true;
}

/** Force emit (e.g. stuck-lock recovery) — still deduped within cycle. */
export function forceEmitInteractionEnd(): boolean {
  if (endEmittedForCycleId === interactionEndCycleId) return false;
  endEmittedForCycleId = interactionEndCycleId;
  eventBus.emit('interaction:end', {});
  return true;
}

/** Hard reset for engine dispose / HMR. */
export function resetInteractionEndDedupState(): void {
  interactionEndCycleId = 0;
  endEmittedForCycleId = -1;
}

registerHmrDispose(resetInteractionEndDedupState);
