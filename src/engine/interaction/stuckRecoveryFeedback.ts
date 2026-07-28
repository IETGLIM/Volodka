/** Player-facing copy when interaction FSM auto-recovers from a stuck state. */

import {
  InteractionState,
  INTERACTION_STATE_LABELS,
} from '@/engine/interaction/interactionMachine';

export type StuckRecoveryPayload = {
  fromState: number;
  targetNpcId: string | null;
};

/** Short toast shown after `interaction:stuck_recovery`. */
export function getStuckRecoveryUserMessage(payload: StuckRecoveryPayload): string {
  const fromState = payload.fromState as InteractionState;
  switch (fromState) {
    case InteractionState.Dialogue:
      return 'Диалог завис и сброшен — подойдите снова и нажмите [E]';
    case InteractionState.Approach:
    case InteractionState.Align:
      return 'Подход прерван — отойдите и нажмите [E] ещё раз';
    case InteractionState.Cutscene:
    case InteractionState.Lock:
      return 'Сцена взаимодействия сброшена — можно двигаться. Нажмите [E] у NPC';
    default:
      return 'Взаимодействие сброшено — можно продолжать. Нажмите [E] у NPC';
  }
}

/** Optional secondary line for notifications / a11y. */
export function getStuckRecoveryHintDetail(payload: StuckRecoveryPayload): string {
  const label = INTERACTION_STATE_LABELS[payload.fromState as InteractionState] ?? 'unknown';
  const npc = payload.targetNpcId ? ` · NPC: ${payload.targetNpcId}` : '';
  return `Сброс с этапа «${label}»${npc}`;
}
