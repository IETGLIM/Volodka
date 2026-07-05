import { FIRST_READING_QUEST_ID } from './firstReadingCelebrationContent';

/** Quest ids that use a dedicated cinematic celebration instead of matrix quote + complete dialog. */
const CINEMATIC_CELEBRATION_QUESTS = new Set<string>([FIRST_READING_QUEST_ID]);
export function usesCinematicQuestCelebration(questId: string): boolean {
  return CINEMATIC_CELEBRATION_QUESTS.has(questId);
}
