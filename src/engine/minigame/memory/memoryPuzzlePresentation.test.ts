import { describe, expect, it } from 'vitest';
import {
  buildCellAriaLabel,
  buildPhaseAnnouncement,
  calculateMemoryRewards,
  generatePattern,
  getEffectiveShowTiming,
  getRating,
} from '@/engine/minigame/memory/memoryPuzzlePresentation';

describe('memoryPuzzlePresentation', () => {
  it('generates patterns without adjacent duplicates', () => {
    const pattern = generatePattern(8);
    expect(pattern).toHaveLength(8);
    for (let i = 1; i < pattern.length; i += 1) {
      expect(pattern[i]).not.toBe(pattern[i - 1]);
    }
  });

  it('extends existing patterns', () => {
    const base = [0, 1, 2];
    const extended = generatePattern(5, base);
    expect(extended.slice(0, 3)).toEqual(base);
    expect(extended).toHaveLength(5);
  });

  it('builds rating tiers', () => {
    expect(getRating(2).label).toBe('Новичок');
    expect(getRating(6).label).toBe('Оператор');
    expect(getRating(10).label).toBe('Нейромант');
  });

  it('caps memory rewards', () => {
    expect(calculateMemoryRewards(20)).toEqual({ xpReward: 20, karmaReward: 10, codingSkill: 1 });
  });

  it('builds cell aria labels', () => {
    expect(buildCellAriaLabel(0)).toBe('Нейрон 1');
    expect(buildCellAriaLabel(15)).toBe('Нейрон 16');
  });

  it('builds phase announcements', () => {
    expect(buildPhaseAnnouncement('input', 2, 5, 3, false)).toContain('Раунд 2');
    expect(buildPhaseAnnouncement('showing', 1, 4, 3, true)).toContain('Повторите');
  });

  it('slows show timing in simplified mode', () => {
    const normal = getEffectiveShowTiming('hacker', false);
    const simplified = getEffectiveShowTiming('hacker', true);
    expect(simplified.showDelay).toBeGreaterThan(normal.showDelay);
    expect(simplified.showDuration).toBeGreaterThan(normal.showDuration);
  });
});
