import { describe, expect, it } from 'vitest';
import {
  calculatePoetryCompositionRewards,
  calculateRoundScore,
  getQualityRating,
  parsePoemLine,
} from '@/engine/minigame/poetryComposition/poetryCompositionPresentation';

describe('poetryCompositionPresentation', () => {
  it('parses poem lines with blanks', () => {
    const { segments, blankCount } = parsePoemLine('И в ___ ночи', 0);
    expect(blankCount).toBe(1);
    expect(segments).toEqual([
      { type: 'text', content: 'И в ' },
      { type: 'blank', content: 'blank-0', blankIndex: 0 },
      { type: 'text', content: ' ночи' },
    ]);
  });

  it('calculates round score from word quality', () => {
    const score = calculateRoundScore(
      new Map([
        [0, { word: 'a', quality: 2 }],
        [1, { word: 'b', quality: 3 }],
      ]),
    );
    expect(score).toBe(5);
  });

  it('maps quality rating and rewards', () => {
    expect(getQualityRating(25).label).toBe('Мастер слова');
    expect(calculatePoetryCompositionRewards(10)).toEqual({ xpReward: 10, karmaReward: 3 });
  });
});
