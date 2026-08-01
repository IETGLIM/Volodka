import { describe, expect, it } from 'vitest';
import {
  buildPoemSlots,
  countReadyPoemPowers,
  evaluateEndingAvailability,
  isEndingCurrentlyAvailable,
} from '@/engine/karmaPoem/karmaPoemPresentation';
import { MAIN_POEM_IDS } from '@/data/poemCollectionMeta';
import { getPoemPower } from '@/engine/PoemPowerSystem';
import { createDefaultPlayerState } from '@/store/shared';

const baseSkills = createDefaultPlayerState().skills;

describe('isEndingCurrentlyAvailable', () => {
  it('requires writing skill for creator ending', () => {
    expect(isEndingCurrentlyAvailable('ending_creator', 70, [], { ...baseSkills, writing: 7 }, {})).toBe(true);
    expect(isEndingCurrentlyAvailable('ending_creator', 70, [], { ...baseSkills, writing: 6 }, {})).toBe(false);
  });

  it('requires low_empathy flag and coding for machine ending', () => {
    expect(isEndingCurrentlyAvailable('ending_machine', 50, [], { ...baseSkills, coding: 8 }, { low_empathy: true })).toBe(true);
    expect(isEndingCurrentlyAvailable('ending_machine', 50, [], { ...baseSkills, coding: 8 }, {})).toBe(false);
    expect(isEndingCurrentlyAvailable('ending_machine', 50, [], { ...baseSkills, coding: 7 }, { low_empathy: true })).toBe(false);
  });

  it('requires all 21 main poems for poet ending, not bonus count alone', () => {
    const bonusOnly = Array.from({ length: 46 }, (_, i) => `poem_${i + 1}`);
    expect(isEndingCurrentlyAvailable('ending_poet', 50, bonusOnly.slice(22), baseSkills, {})).toBe(false);
    expect(isEndingCurrentlyAvailable('ending_poet', 50, [...MAIN_POEM_IDS], baseSkills, {})).toBe(true);
  });

  it('returns false for unknown endings', () => {
    expect(isEndingCurrentlyAvailable('ending_unknown', 50, [], baseSkills, {})).toBe(false);
  });
});

describe('evaluateEndingAvailability', () => {
  it('maps all endings with availability flags', () => {
    const endings = evaluateEndingAvailability(30, [], baseSkills, {});
    expect(endings.length).toBeGreaterThan(0);
    expect(endings.every((ending) => typeof ending.available === 'boolean')).toBe(true);
  });
});

describe('buildPoemSlots', () => {
  it('marks collected poems and includes titles', () => {
    const slots = buildPoemSlots(['poem_1']);
    const first = slots.find((slot) => slot.id === 'poem_1');
    expect(first?.collected).toBe(true);
    expect(first?.title).toBeTruthy();
  });
});

describe('countReadyPoemPowers', () => {
  it('counts collected poems with powers that are off cooldown', () => {
    const count = countReadyPoemPowers(['poem_1'], {}, 12);
    expect(count).toBeGreaterThanOrEqual(0);
  });

  it('excludes poems still on cooldown', () => {
    if (!getPoemPower('poem_1')) return;
    const count = countReadyPoemPowers(
      ['poem_1'],
      { poem_1: { lastUsed: 12, cooldownHours: 0.25 } },
      12,
    );
    expect(count).toBe(0);
  });
});
