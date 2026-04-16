import { describe, expect, it } from 'vitest';
import { formatSkillCheckHint, getSkillCheckTier } from './skillCheckHint';
import type { PlayerSkills } from '@/data/types';

const baseSkills: PlayerSkills = {
  writing: 40,
  perception: 40,
  empathy: 40,
  imagination: 40,
  logic: 40,
  coding: 40,
  persuasion: 40,
  intuition: 40,
  resilience: 40,
  introspection: 40,
  skillPoints: 0,
};

describe('skillCheckHint', () => {
  it('tiers by margin against difficulty', () => {
    expect(getSkillCheckTier(30, 50)).toBe('very_low');
    expect(getSkillCheckTier(44, 50)).toBe('low');
    expect(getSkillCheckTier(50, 50)).toBe('mid');
    expect(getSkillCheckTier(60, 50)).toBe('high');
  });

  it('formatSkillCheckHint includes Russian skill label', () => {
    const hint = formatSkillCheckHint('writing', 50, { ...baseSkills, writing: 55 });
    expect(hint).toContain('Письмо');
    expect(hint).toContain('50');
    expect(hint.toLowerCase()).toMatch(/шанс/);
  });
});
