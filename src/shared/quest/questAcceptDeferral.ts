/**
 * Quest accept deferral — pure functions, no Engine/UI imports.
 *
 * This module lives in `@/shared/quest/` so that both Store and Engine can
 * import it without violating the ESLint layer boundary
 * (Store must not import Engine — see eslint.config.js no-restricted-imports).
 *
 * The original `@/engine/quest/questAcceptDeferral.ts` re-exports these
 * functions plus the QuestDialogState-typed helpers that need UI layer types.
 */

/** Quests granted silently during the apartment prologue — no accept popup in-room. */
const SILENT_APARTMENT_QUESTS = new Set(['first_reading', 'morning_sync']);

/** Quest accept dialogs that should wait until the player reaches a specific scene. */
const QUEST_ACCEPT_SCENE_GATES: Record<string, string> = {
  maria_connection: 'street_night',
};

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
  return questId === 'first_reading' || questId === 'morning_sync';
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
  if (input.currentNodeId === 'start' || input.currentNodeId === null) return false;
  return true;
}
