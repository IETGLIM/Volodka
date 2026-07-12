import { describe, expect, it } from 'vitest';
import {
  formatAffinityValue,
  getAffinityBarPercent,
  getAffinityVisualStyle,
  getRelationFooterCounts,
  getRelationLevel,
  sortNpcRelationsByValue,
} from '@/engine/npcRelationship/npcRelationshipPresentation';

describe('npcRelationshipPresentation', () => {
  it('classifies relation levels', () => {
    expect(getRelationLevel(80)).toBe('ally');
    expect(getRelationLevel(50)).toBe('neutral');
    expect(getRelationLevel(10)).toBe('enemy');
  });

  it('sorts relations by descending value', () => {
    const sorted = sortNpcRelationsByValue([
      { npcId: 'a', value: 10 },
      { npcId: 'b', value: 90 },
      { npcId: 'c', value: 50 },
    ]);
    expect(sorted.map((entry) => entry.npcId)).toEqual(['b', 'c', 'a']);
  });

  it('returns unified affinity visual styles', () => {
    const high = getAffinityVisualStyle(85);
    expect(high.badge.text).toContain('amber');
    expect(high.bar).toBe('bg-amber-500');
    expect(high.text).toBe('text-amber-400');
  });

  it('formats affinity values and bar percent', () => {
    expect(formatAffinityValue(5)).toBe('+5');
    expect(formatAffinityValue(-3)).toBe('-3');
    expect(getAffinityBarPercent(0)).toBe(50);
  });

  it('counts allies and enemies for footer', () => {
    expect(
      getRelationFooterCounts([
        { npcId: 'a', value: 80 },
        { npcId: 'b', value: 20 },
        { npcId: 'c', value: 50 },
      ]),
    ).toEqual({ total: 3, allies: 1, enemies: 1 });
  });
});
