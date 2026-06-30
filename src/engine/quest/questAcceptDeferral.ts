/**
 * Quest accept deferral — Engine-layer facade.
 *
 * Re-exports pure functions from `@/shared/quest/questAcceptDeferral` and
 * adds QuestDialogState-typed helpers that need UI layer types.
 *
 * Store imports from `@/shared/quest/questAcceptDeferral` directly to avoid
 * the ESLint Store→Engine boundary violation.
 */

import type { QuestDialogState } from '@/components/game/orchestrator/types';
export {
  shouldDeferQuestAcceptDialog,
  shouldSuppressQuestAcceptEmit,
  shouldGateFirstReadingCelebration,
  shouldFlushGatedFirstReadingCelebration,
} from '@/shared/quest/questAcceptDeferral';

export type QuestAcceptPayload = NonNullable<QuestDialogState>;

export function isQuestCompletionFlowBusy(input: {
  matrixQuoteActive: boolean;
  questCompleteActive: boolean;
  pendingQuestComplete: QuestDialogState;
  cinematicCelebrationActive?: boolean;
}): boolean {
  return (
    input.matrixQuoteActive ||
    input.questCompleteActive ||
    input.pendingQuestComplete !== null ||
    input.cinematicCelebrationActive === true
  );
}
