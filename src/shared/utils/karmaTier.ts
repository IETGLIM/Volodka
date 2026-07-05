import { KARMA_HIGH_THRESHOLD, KARMA_LOW_THRESHOLD } from '@/data/constants';

export type KarmaTier = 'positive' | 'neutral' | 'negative';

export function getKarmaTier(karma: number): KarmaTier {
  if (karma >= KARMA_HIGH_THRESHOLD) return 'positive';
  if (karma <= KARMA_LOW_THRESHOLD) return 'negative';
  return 'neutral';
}

/** Screen-reader / colorblind-friendly tier label (Russian UI) */
export function getKarmaTierLabel(karma: number): string {
  switch (getKarmaTier(karma)) {
    case 'positive':
      return 'Позитивная';
    case 'negative':
      return 'Негативная';
    default:
      return 'Нейтральная';
  }
}
