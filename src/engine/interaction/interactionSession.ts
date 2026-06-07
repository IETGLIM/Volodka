import { InteractionState } from '@/engine/interaction/interactionMachine';
import { registerHmrDispose } from '@/shared/dev/hmrDispose';

export interface InteractionSessionSnapshot {
  state: InteractionState;
  targetNpcId: string | null;
}

const IDLE: InteractionSessionSnapshot = {
  state: InteractionState.Idle,
  targetNpcId: null,
};

/** Read-only view of interaction FSM state (safe outside R3F tree). */
let session: InteractionSessionSnapshot = { ...IDLE };

export function getInteractionSession(): Readonly<InteractionSessionSnapshot> {
  return session;
}

export function getInteractionState(): InteractionState {
  return session.state;
}

export function getInteractionTargetNPCId(): string | null {
  return session.targetNpcId;
}

export function isInteractionLocked(): boolean {
  const s = session.state;
  return (
    s === InteractionState.Approach ||
    s === InteractionState.Cutscene ||
    s === InteractionState.Align ||
    s === InteractionState.Lock ||
    s === InteractionState.Dialogue
  );
}

/** Single writer for module-level interaction snapshot. */
export function writeInteractionSession(
  state: InteractionState,
  targetNpcId: string | null,
): void {
  session = { state, targetNpcId };
}

export function resetInteractionSession(): void {
  session = { ...IDLE };
}

registerHmrDispose(resetInteractionSession);
