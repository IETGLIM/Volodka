import {
  InteractionState,
  INTERACTION_STATE_LABELS,
  isValidInteractionTransition,
} from '@/engine/interaction/interactionMachine';
import { eventBus } from '@/engine/EventBus';
import { devWarn } from '@/shared/utils/devLog';
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

/** FP exploration camera stays active during auto-walk / splash; dialogue shots use dialogStrategy. */
export function shouldKeepFirstPersonExplorationCamera(): boolean {
  if (!isInteractionLocked()) return true;
  const s = session.state;
  return s === InteractionState.Approach || s === InteractionState.Cutscene;
}

export interface WriteInteractionSessionOptions {
  /** Bypass transition validation (HMR/dispose hard reset only). */
  force?: boolean;
}

/** Single writer for module-level interaction snapshot. Returns false if transition rejected. */
export function writeInteractionSession(
  state: InteractionState,
  targetNpcId: string | null,
  options?: WriteInteractionSessionOptions,
): boolean {
  const from = session.state;
  if (!options?.force && !isValidInteractionTransition(from, state)) {
    devWarn(
      `[interactionSession] Invalid transition ${INTERACTION_STATE_LABELS[from]} → ${INTERACTION_STATE_LABELS[state]}`,
    );
    return false;
  }
  session = { state, targetNpcId };
  return true;
}

export function resetInteractionSession(): void {
  session = { ...IDLE };
}

const unsubSceneTransitionStart = eventBus.on('scene:transition_start', () => {
  resetInteractionSession();
});

function disposeInteractionSessionModule(): void {
  unsubSceneTransitionStart();
  resetInteractionSession();
}

registerHmrDispose(disposeInteractionSessionModule);
