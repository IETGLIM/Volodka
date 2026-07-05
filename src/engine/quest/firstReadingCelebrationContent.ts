import { getPoemById } from '@/data/gameDataLoader';
import { getQuoteByTrigger } from '@/data/matrixQuotes';
import { QUEST_DEFINITIONS } from '@/data/quests';
import {
  computeQuestCreditReward,
  formatQuestCompletionRewards,
  getDefaultQuestXp,
} from '@/shared/utils/questRewards';

export const FIRST_READING_QUEST_ID = 'first_reading' as const;
export const FIRST_READING_POEM_ID = 'poem_2' as const;

export type FirstReadingCelebrationContent = {
  quoteText: string;
  poemData: { title: string; lines: string[] } | null;
  rewardSummary: string;
  bonusXp: number;
  bonusCredits: number;
};

/** Resolve copy and reward strings for the first_reading cinematic overlay. */
export function prepareFirstReadingCelebrationContent(): FirstReadingCelebrationContent {
  const quote = getQuoteByTrigger(FIRST_READING_QUEST_ID);
  const poem = getPoemById(FIRST_READING_POEM_ID);
  const questDef = QUEST_DEFINITIONS.find((d) => d.id === FIRST_READING_QUEST_ID) ?? null;

  if (!poem) {
    console.warn(`[FirstReadingCelebration] Poem "${FIRST_READING_POEM_ID}" not found`);
  }
  if (!questDef) {
    console.warn(`[FirstReadingCelebration] Quest "${FIRST_READING_QUEST_ID}" not found`);
  }

  const poemData = poem
    ? { title: poem.title, lines: poem.lines.filter((line) => line.trim().length > 0) }
    : null;

  return {
    quoteText: quote?.text.trim() ?? '',
    poemData,
    rewardSummary: questDef
      ? formatQuestCompletionRewards(questDef)
      : 'Награда за задание получена.',
    bonusXp: questDef ? getDefaultQuestXp(questDef.questType) : 0,
    bonusCredits: questDef ? computeQuestCreditReward(questDef) : 0,
  };
}
