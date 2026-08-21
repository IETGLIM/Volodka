import { getPoemById } from '@/data/gameDataLoader';
import { getQuoteByTrigger } from '@/data/matrixQuotes';
import { QUEST_DEFINITIONS } from '@/data/quests';
import { getPoemPower } from '@/engine/PoemPowerSystem';
import { devWarn } from '@/shared/utils/devLog';
import {
  formatPoemExcerptText,
  getPoemExcerpt,
  POEM_EXCERPT_LINE_COUNT,
} from '@/shared/poem/poemExcerpt';
import {
  computeQuestCreditReward,
  formatQuestCompletionRewards,
  getDefaultQuestXp,
} from '@/shared/utils/questRewards';

export const FIRST_READING_QUEST_ID = 'first_reading' as const;
export const FIRST_READING_POEM_ID = 'poem_2' as const;

export type FirstReadingCelebrationContent = {
  /** Matrix-quote kicker (secondary). */
  quoteText: string;
  /** Typewriter body — 4-line poem excerpt. */
  excerptText: string;
  excerptLines: string[];
  isFragment: boolean;
  poemData: { title: string; lines: string[]; author: string } | null;
  combatCue: string | null;
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
    if (import.meta.env.DEV) devWarn(`[FirstReadingCelebration] Poem "${FIRST_READING_POEM_ID}" not found`);
  }
  if (!questDef) {
    if (import.meta.env.DEV) devWarn(`[FirstReadingCelebration] Quest "${FIRST_READING_QUEST_ID}" not found`);
  }

  const excerpt = getPoemExcerpt(poem?.lines ?? [], POEM_EXCERPT_LINE_COUNT);
  const power = poem ? getPoemPower(poem.id) : undefined;
  const combatCue = power ? `Бой · ${power.name}` : null;

  const poemData = poem
    ? {
        title: poem.title,
        author: poem.author,
        lines: excerpt.lines,
      }
    : null;

  return {
    quoteText: quote?.text.trim() ?? '',
    excerptText: formatPoemExcerptText(excerpt.lines),
    excerptLines: excerpt.lines,
    isFragment: excerpt.isFragment,
    poemData,
    combatCue,
    rewardSummary: questDef
      ? formatQuestCompletionRewards(questDef)
      : 'Награда за задание получена.',
    bonusXp: questDef ? getDefaultQuestXp(questDef.questType) : 0,
    bonusCredits: questDef ? computeQuestCreditReward(questDef) : 0,
  };
}
