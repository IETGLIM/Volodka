/* ─── Volodka RPG – Emergency Interaction State Reset ───
 * Escape hatch for when the 5-guard interaction chain gets stuck:
 *   isOverlayBlockingRef → isGameplayOverlayLocomotionLocked →
 *   isInteractionLocked (FSM) → isEKeyConsumed (debounce) → activeCutsceneId
 *
 * Call forceResetAllInteractionState() to blast through ALL of them at once.
 */

import { resetInteractionSession } from '@/engine/interaction/interactionSession';
import { resetEKeyConsumption } from '@/engine/input/eKeyConsumption';
import { resetInteractionEndDedupState } from '@/engine/interaction/interactionEndDedup';
import { dispatchGameAction } from '@/engine/GameActionDispatcher';
import { dispatchStateAction } from '@/engine/StateDispatcher';
import { closeNarrativeOverlay, closeDiegeticNarrative } from '@/engine/scene/narrativeOverlay';
import { devWarn } from '@/shared/utils/devLog';

export function forceResetAllInteractionState(): void {
  resetInteractionSession();
  resetEKeyConsumption();
  resetInteractionEndDedupState();

  dispatchGameAction({ type: 'cutscene/clear' });
  dispatchStateAction({ type: 'phase/clearGameplayFlags' });

  closeNarrativeOverlay();
  closeDiegeticNarrative();

  devWarn('[emergencyInteractionReset] All interaction state force-reset.');
}