import { describe, expect, it } from 'vitest';
import {
  computeHourDelta,
  estimateElapsedFromStart,
  isQuestTimedOut,
  remainingQuestHours,
} from '@/engine/quest/questTimeLimits';

describe('questTimeLimits', () => {
  it('computeHourDelta handles same-day advance', () => {
    expect(computeHourDelta(10, 13)).toBe(3);
  });

  it('computeHourDelta handles midnight wrap', () => {
    expect(computeHourDelta(22, 2)).toBe(4);
  });

  it('estimateElapsedFromStart matches computeHourDelta', () => {
    expect(estimateElapsedFromStart(8, 11)).toBe(3);
    expect(estimateElapsedFromStart(20, 4)).toBe(8);
  });

  it('isQuestTimedOut fails at limit boundary', () => {
    expect(isQuestTimedOut(2, 2)).toBe(true);
    expect(isQuestTimedOut(1.99, 2)).toBe(false);
  });

  it('remainingQuestHours never goes negative', () => {
    expect(remainingQuestHours(1, 4)).toBe(3);
    expect(remainingQuestHours(5, 4)).toBe(0);
  });
});
