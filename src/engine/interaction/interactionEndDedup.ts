import { eventBus } from '@/engine/EventBus';
import { getInteractionState, isInteractionLocked } from '@/engine/interaction/interactionSession';
import { InteractionState } from '@/engine/interaction/interactionMachine';

let endEmittedForSession = false;

/** Reset when a new interaction / narrative session begins. */
export function resetInteractionEndDedup(): void {
  endEmittedForSession = false;
}

/** Whether interaction:end was already emitted for the current session. */
export function wasInteractionEndEmitted(): boolean {
  return endEmittedForSession;
}

/**
 * Emit interaction:end at most once per session while interaction is active.
 * Returns true when the event was emitted.
 */
export function emitInteractionEndIfNeeded(): boolean {
  if (endEmittedForSession) return false;

  const interactionState = getInteractionState();
  if (interactionState === InteractionState.Idle && !isInteractionLocked()) {
    return false;
  }

  endEmittedForSession = true;
  eventBus.emit('interaction:end', {});
  return true;
}

/** Force emit (e.g. stuck-lock recovery) — still deduped within session. */
export function forceEmitInteractionEnd(): boolean {
  if (endEmittedForSession) return false;
  endEmittedForSession = true;
  eventBus.emit('interaction:end', {});
  return true;
}
