/* ─── Volodka RPG – Emergency Interaction State Reset ───
 * Escape hatch for when the 5-guard interaction chain gets stuck:
 *   isOverlayBlockingRef → isGameplayOverlayLocomotionLocked →
 *   isInteractionLocked (FSM) → isEKeyConsumed (debounce) → activeCutsceneId
 *
 * Call forceResetAllInteractionState() to blast through ALL of them at once.
 */

import { resetInteractionSession, getInteractionTargetNPCId } from '@/engine/interaction/interactionSession';
import { InteractionState } from '@/engine/interaction/interactionMachine';
import { resetEKeyConsumption } from '@/engine/input/eKeyConsumption';
import { resetInteractionEndDedupState } from '@/engine/interaction/interactionEndDedup';
import { dispatchGameAction } from '@/engine/GameActionDispatcher';
import { dispatchStateAction } from '@/engine/StateDispatcher';
import { closeNarrativeOverlay, closeDiegeticNarrative } from '@/engine/scene/narrativeOverlay';
import { eventBus } from '@/engine/EventBus';
import { devWarn } from '@/shared/utils/devLog';
import { getStuckRecoveryReapproachHint, getStuckRecoveryUserMessage } from '@/engine/interaction/stuckRecoveryFeedback';

export function forceResetAllInteractionState(): void {
  // Snapshot the target NPC BEFORE resetting the module session, so we can
  // emit a proper state_change event that lets NPCSystemWrapper +
  // InteractionSystemBridge re-sync their React state/refs. Without these
  // emissions, the module resets but React-side stateRef stays stale — the
  // player is soft-locked out of all interactions until the 5s global
  // timeout fires. (Task 3-B #2.)
  const prevTargetNpcId = getInteractionTargetNPCId();

  resetInteractionSession();
  resetEKeyConsumption();
  resetInteractionEndDedupState();

  dispatchGameAction({ type: 'cutscene/clear' });
  dispatchStateAction({ type: 'phase/clearGameplayFlags' });

  closeNarrativeOverlay();
  closeDiegeticNarrative();

  // Notify all listeners that the interaction ended cleanly so React state
  // (NPCSystemWrapper, InteractionSystemBridge.stateRef) re-syncs to Idle.
  eventBus.emit('interaction:state_change', {
    state: InteractionState.Idle,
    npcId: prevTargetNpcId ?? undefined,
  });
  eventBus.emit('interaction:end', {});
  const recoveryPayload = {
    fromState: InteractionState.Dialogue,
    targetNpcId: prevTargetNpcId,
  };
  const recoveryText = getStuckRecoveryUserMessage(recoveryPayload);
  const reapproach = getStuckRecoveryReapproachHint(recoveryPayload);
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

  devWarn('[emergencyInteractionReset] All interaction state force-reset.');
}