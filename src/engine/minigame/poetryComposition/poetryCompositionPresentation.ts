import type { Transition } from 'framer-motion';
import {
  POETRY_COMPOSITION_ACCENT_RGB,
  POETRY_COMPOSITION_LABELS,
  POETRY_KARMA_REWARD_MAX,
  POETRY_KARMA_REWARD_MIN,
  POETRY_KARMA_SCORE_DIVISOR,
  POETRY_QUALITY_MASTER_THRESHOLD,
  POETRY_QUALITY_POET_THRESHOLD,
  POETRY_XP_REWARD_MAX,
  POETRY_XP_REWARD_MIN,
} from '@/engine/minigame/poetryComposition/poetryCompositionConstants';
import type { BlankDef, PoemTemplate, WordOption } from '@/engine/minigame/poetryComposition/poetryCompositionTemplates';

export type TextSegment = {
  type: 'text' | 'blank';
  content: string;
  blankIndex?: number;
};

export function shuffleArray<T>(items: T[]): T[] {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }
  return shuffled;
}

export function pickRandomTemplates(templates: PoemTemplate[], count: number): PoemTemplate[] {
  return shuffleArray(templates).slice(0, count);
}

export function flattenTemplateBlanks(template: PoemTemplate): BlankDef[] {
  return template.lines.flatMap((line) => line.blanks);
}

export function buildWordBankOptions(blanks: BlankDef[]): Array<WordOption & { blankIndex: number }> {
  const options: Array<WordOption & { blankIndex: number }> = [];
  blanks.forEach((blank, index) => {
    blank.options.forEach((option) => {
      options.push({ ...option, blankIndex: index });
    });
  });
  return shuffleArray(options);
}

export function parsePoemLine(
  text: string,
  blankStartIndex: number,
): { segments: TextSegment[]; blankCount: number } {
  const segments: TextSegment[] = [];
  let blankCount = 0;
  let remaining = text;
  let currentBlankIndex = blankStartIndex;

  while (remaining.length > 0) {
    const blankPos = remaining.indexOf('___');
    if (blankPos === -1) {
      segments.push({ type: 'text', content: remaining });
      break;
    }

    if (blankPos > 0) {
      segments.push({ type: 'text', content: remaining.substring(0, blankPos) });
    }

    segments.push({
      type: 'blank',
      content: `blank-${currentBlankIndex}`,
      blankIndex: currentBlankIndex,
    });
    currentBlankIndex++;
    blankCount++;
    remaining = remaining.substring(blankPos + 3);
  }

  return { segments, blankCount };
}

export function parseTemplateLines(template: PoemTemplate): TextSegment[][] {
  const result: TextSegment[][] = [];
  let blankCounter = 0;
  for (const line of template.lines) {
    const { segments, blankCount } = parsePoemLine(line.text, blankCounter);
    result.push(segments);
    blankCounter += blankCount;
  }
  return result;
}

export function calculateRoundScore(filledBlanks: Map<number, WordOption>): number {
  let roundScore = 0;
  filledBlanks.forEach((option) => {
    roundScore += option.quality;
  });
  return roundScore;
}

export function getQualityRating(totalScore: number): { label: string; color: string } {
  if (totalScore >= POETRY_QUALITY_MASTER_THRESHOLD) {
    return { label: POETRY_COMPOSITION_LABELS.qualityMaster, color: `rgba(${POETRY_COMPOSITION_ACCENT_RGB}, 1)` };
  }
  if (totalScore >= POETRY_QUALITY_POET_THRESHOLD) {
    return { label: POETRY_COMPOSITION_LABELS.qualityPoet, color: '#ffcc00' };
  }
  return { label: POETRY_COMPOSITION_LABELS.qualityNovice, color: '#6a8a9a' };
}

export function calculatePoetryCompositionRewards(totalScore: number): {
  xpReward: number;
  karmaReward: number;
} {
  return {
    xpReward: Math.min(POETRY_XP_REWARD_MAX, Math.max(POETRY_XP_REWARD_MIN, totalScore)),
    karmaReward: Math.min(
      POETRY_KARMA_REWARD_MAX,
      Math.max(POETRY_KARMA_REWARD_MIN, Math.floor(totalScore / POETRY_KARMA_SCORE_DIVISOR)),
    ),
  };
}

export function getShellTransition(reducedMotion: boolean): Transition {
  return reducedMotion ? { duration: 0 } : { duration: 0.25, ease: 'easeOut' };
}

export function getRoundTransition(reducedMotion: boolean): Transition {
  return reducedMotion ? { duration: 0 } : { duration: 0.3 };
}

export function getResultsTransition(reducedMotion: boolean): Transition {
  return reducedMotion ? { duration: 0 } : { duration: 0.3 };
}

export function getScorePulseTransition(reducedMotion: boolean): Transition {
  return reducedMotion ? { duration: 0 } : { duration: 0.3 };
}

export function getPanelEnterVariants(reducedMotion: boolean): {
  initial: false | { opacity: number; scale: number };
  animate: { opacity: number; scale: number };
  exit: { opacity: number; scale: number };
} {
  if (reducedMotion) {
    return { initial: false, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 1 } };
  }
  return {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  };
}

export function getRoundEnterVariants(reducedMotion: boolean): {
  initial: false | { opacity: number; x: number };
  animate: { opacity: number; x: number };
  exit: { opacity: number; x: number };
} {
  if (reducedMotion) {
    return { initial: false, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: 0 } };
  }
  return {
    initial: { opacity: 0, x: 30 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -30 },
  };
}

export function getFinishButtonVariants(reducedMotion: boolean): {
  initial: false | { opacity: number; y: number };
  animate: { opacity: number; y: number };
  exit: { opacity: number; y: number };
} {
  if (reducedMotion) {
    return { initial: false, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 0 } };
  }
  return {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 10 },
  };
}

export function buildBlankAriaLabel(blankIndex: number, filledWord?: WordOption): string {
  const humanIndex = blankIndex + 1;
  return filledWord
    ? POETRY_COMPOSITION_LABELS.blankFilled(humanIndex, filledWord.word)
    : POETRY_COMPOSITION_LABELS.blankEmpty(humanIndex);
}

export function buildWordAriaLabel(word: string, isUsed: boolean): string {
  return isUsed
    ? POETRY_COMPOSITION_LABELS.wordUsed(word)
    : POETRY_COMPOSITION_LABELS.selectWord(word);
}

export function buildResultsAnnouncement(score: number, ratingLabel: string): string {
  return POETRY_COMPOSITION_LABELS.resultsSummary(score, ratingLabel);
}
