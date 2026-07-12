import { describe, expect, it } from 'vitest';
import {
  canAffordPerk,
  computeCategoryCounts,
  getPerkCost,
  getPerkState,
} from '@/engine/perks/perksPanelPresentation';
import type { PerkDefinition } from '@/data/perks';

const samplePerk: PerkDefinition = {
  id: 'test_perk',
  name: 'Test',
  description: 'Desc',
  category: 'survival',
  icon: 'Shield',
  minLevel: 3,
  requiredPerks: [],
  effects: [],
  flavorText: '',
};

describe('perksPanelPresentation', () => {
  it('getPerkCost defaults to 1', () => {
    expect(getPerkCost(samplePerk)).toBe(1);
    expect(getPerkCost({ cost: 2 })).toBe(2);
  });

  it('canAffordPerk respects perk cost', () => {
    expect(canAffordPerk(1, samplePerk)).toBe(true);
    expect(canAffordPerk(0, samplePerk)).toBe(false);
    expect(canAffordPerk(1, { cost: 2 })).toBe(false);
  });

  it('getPerkState returns acquired when unlocked', () => {
    expect(getPerkState(samplePerk, ['test_perk'], 1, 5)).toBe('acquired');
  });

  it('getPerkState returns locked below min level', () => {
    expect(getPerkState(samplePerk, [], 1, 1)).toBe('locked');
  });

  it('computeCategoryCounts totals perks', () => {
    const counts = computeCategoryCounts([]);
    const total = Object.values(counts).reduce((sum, entry) => sum + entry.total, 0);
    expect(total).toBeGreaterThan(0);
  });
});
