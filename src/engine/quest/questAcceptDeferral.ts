import type { QuestDialogState } from '@/components/game/orchestrator/types';

export type QuestAcceptPayload = NonNullable<QuestDialogState>;

/** Quest accept dialogs that should wait until the player reaches a specific scene. */
const QUEST_ACCEPT_SCENE_GATES: Record<string, string> = {
  maria_connection: 'street_night',
};

/** Quests granted silently during the apartment prologue — no accept popup in-room. */
const SILENT_APARTMENT_QUESTS = new Set(['first_reading']);

export function shouldDeferQuestAcceptDialog(
  questId: string,
  sceneId: string,
): boolean {
  const requiredScene = QUEST_ACCEPT_SCENE_GATES[questId];
  if (requiredScene && sceneId !== requiredScene) {
    return true;
  }

  if (SILENT_APARTMENT_QUESTS.has(questId) && sceneId === 'volodka_room') {
    return true;
  }

  return false;
}

export function shouldSuppressQuestAcceptEmit(questId: string): boolean {
  return questId === 'first_reading';
}

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

/** Wait for the wake prologue overlay to close before celebrating in the apartment. */
export function shouldGateFirstReadingCelebration(
  questId: string,
  sceneId: string,
): boolean {
  return questId === 'first_reading' && sceneId === 'volodka_room';
}

export function shouldFlushGatedFirstReadingCelebration(input: {
  sceneId: string;
  showStoryOverlay: boolean;
  currentNodeId: string | null;
}): boolean {
  if (input.sceneId !== 'volodka_room') return true;
  if (input.showStoryOverlay) return false;
  // Wake sets currentNodeId to `start` before the overlay opens — wait for explore hub.
  if (input.currentNodeId === 'start' || input.currentNodeId === null) return false;
  return true;
}
