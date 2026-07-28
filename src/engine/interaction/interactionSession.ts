import {
  InteractionState,
  INTERACTION_STATE_LABELS,
  isValidInteractionTransition,
} from '@/engine/interaction/interactionMachine';
import { eventBus } from '@/engine/EventBus';
import { devWarn } from '@/shared/utils/devLog';
import { registerHmrDispose } from '@/shared/dev/hmrDispose';
import { getStuckRecoveryReapproachHint, getStuckRecoveryUserMessage } from '@/engine/interaction/stuckRecoveryFeedback';
import { emitStuckRecoveryNpcRingFocus } from '@/engine/interaction/stuckRecoveryNpcFocus';
import { triggerStuckSoftLocomotionUnlock } from '@/engine/interaction/stuckSoftLocomotionUnlock';
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

/** Watchdog timeout (ms) for stuck non-Idle FSM states. */
const STUCK_RECOVERY_TIMEOUT_MS = 15_000;
let stuckRecoveryTimer: ReturnType<typeof setTimeout> | null = null;

function clearStuckRecoveryWatchdog(): void {
  if (stuckRecoveryTimer !== null) {
    clearTimeout(stuckRecoveryTimer);
    stuckRecoveryTimer = null;
  }
}

function scheduleStuckRecoveryWatchdog(): void {
  clearStuckRecoveryWatchdog();
  stuckRecoveryTimer = setTimeout(() => {
    stuckRecoveryTimer = null;
    const stuckState = session.state;
    const stuckNpcId = session.targetNpcId;
    devWarn(
      `[interactionSession] Stuck-recovery watchdog fired after ${STUCK_RECOVERY_TIMEOUT_MS / 1000}s. ` +
        `FSM was stuck in ${INTERACTION_STATE_LABELS[stuckState]} (npc=${stuckNpcId}). Auto-resetting to Idle.`,
    );
    eventBus.emit('interaction:stuck_recovery', {
      fromState: stuckState,
      targetNpcId: stuckNpcId,
    });
    // Reset the module-level session first, THEN emit interaction:state_change
    // so listeners (NPCSystemWrapper, InteractionSystemBridge) re-sync their
    // React state/refs to Idle. Without the state_change event, the module
    // resets but React state stays stale — the target NPC remains in 'talk'
    // animation and the bridge's stateRef desyncs. (Task 3-B #4.)
    resetInteractionSession();
    eventBus.emit('interaction:state_change', {
      state: InteractionState.Idle,
      npcId: undefined,
    });
    // Also fire interaction:end so any proximity hint / indicator visuals
    // are torn down consistently with a normal interaction exit.
    eventBus.emit('interaction:end', {});
    const recoveryText = getStuckRecoveryUserMessage({
      fromState: stuckState,
      targetNpcId: stuckNpcId,
    });
    const reapproach = getStuckRecoveryReapproachHint({
      fromState: stuckState,
      targetNpcId: stuckNpcId,
    });
    eventBus.emit('ui:exploration_message', { text: recoveryText });
    eventBus.emit('game:notification', {
      title: recoveryText,
      type: 'info' as const,
    });
    eventBus.emit('ui:exploration_message', { text: reapproach });
    eventBus.emit('game:notification', {
      title: reapproach,
      type: 'info' as const,
    });
    triggerStuckSoftLocomotionUnlock();
    emitStuckRecoveryNpcRingFocus(stuckNpcId);
  }, STUCK_RECOVERY_TIMEOUT_MS);
}

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

  // Manage stuck-recovery watchdog: arm on non-Idle, disarm on Idle/Exit.
  if (state === InteractionState.Idle || state === InteractionState.Exit) {
    clearStuckRecoveryWatchdog();
  } else {
    scheduleStuckRecoveryWatchdog();
  }

  return true;
}

export function resetInteractionSession(): void {
  clearStuckRecoveryWatchdog();
  session = { ...IDLE };
}

const unsubSceneTransitionStart = eventBus.on('scene:transition_start', () => {
  resetInteractionSession();
});

function disposeInteractionSessionModule(): void {
  unsubSceneTransitionStart();
  clearStuckRecoveryWatchdog();
  resetInteractionSession();
}

registerHmrDispose(disposeInteractionSessionModule);
