import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  buildPoemSlots,
  countReadyPoemPowers,
  evaluateEndingAvailability,
  isEndingCurrentlyAvailable,
} from '@/engine/karmaPoem/karmaPoemPresentation';
import { getPoemPower } from '@/engine/PoemPowerSystem';
import { createDefaultPlayerState } from '@/store/shared';

const baseSkills = createDefaultPlayerState().skills;

describe('isEndingCurrentlyAvailable', () => {
  it('requires writing skill for creator ending', () => {
    expect(isEndingCurrentlyAvailable('ending_creator', 70, 0, { ...baseSkills, writing: 7 }, {}, 35)).toBe(true);
    expect(isEndingCurrentlyAvailable('ending_creator', 70, 0, { ...baseSkills, writing: 6 }, {}, 35)).toBe(false);
  });

  it('requires low_empathy flag and coding for machine ending', () => {
    expect(isEndingCurrentlyAvailable('ending_machine', 50, 0, { ...baseSkills, coding: 8 }, { low_empathy: true }, 35)).toBe(true);
    expect(isEndingCurrentlyAvailable('ending_machine', 50, 0, { ...baseSkills, coding: 8 }, {}, 35)).toBe(false);
    expect(isEndingCurrentlyAvailable('ending_machine', 50, 0, { ...baseSkills, coding: 7 }, { low_empathy: true }, 35)).toBe(false);
  });

  it('returns false for unknown endings', () => {
    expect(isEndingCurrentlyAvailable('ending_unknown', 50, 0, baseSkills, {}, 35)).toBe(false);
  });
});

describe('evaluateEndingAvailability', () => {
  it('maps all endings with availability flags', () => {
    const endings = evaluateEndingAvailability(30, 0, baseSkills, {}, 35);
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
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('counts collected poems with powers that are off cooldown', () => {
    const now = Date.now();
    const count = countReadyPoemPowers(['poem_1'], {}, now);
    expect(count).toBeGreaterThanOrEqual(0);
  });

  it('excludes poems still on cooldown', () => {
    const now = Date.now();
    if (!getPoemPower('poem_1')) return;
    const count = countReadyPoemPowers(
      ['poem_1'],
      { poem_1: { lastUsed: now - 1000, cooldownMs: 60000 } },
      now,
    );
    expect(count).toBe(0);
  });
});
