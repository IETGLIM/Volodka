import { describe, it, expect, vi } from 'vitest';
import { rollStrikeDamage } from './combatDamage';
import type { PlayerSkills } from '@/data/types';

const baseSkills = (over: Partial<PlayerSkills>): PlayerSkills => ({
  writing: 10,
  perception: 10,
  empathy: 10,
  imagination: 10,
  logic: 10,
  coding: 10,
  persuasion: 10,
  intuition: 10,
  resilience: 10,
  introspection: 10,
  skillPoints: 0,
  ...over,
});

describe('rollStrikeDamage', () => {
  it('returns at least 1', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const d = rollStrikeDamage(baseSkills({ logic: 0, coding: 0, intuition: 0 }));
    expect(d).toBeGreaterThanOrEqual(1);
    vi.restoreAllMocks();
  });

  it('scales with logic, coding, intuition', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const low = rollStrikeDamage(baseSkills({ logic: 5, coding: 5, intuition: 5 }));
    const high = rollStrikeDamage(baseSkills({ logic: 80, coding: 80, intuition: 80 }));
    expect(high).toBeGreaterThan(low);
    vi.restoreAllMocks();
  });
});
