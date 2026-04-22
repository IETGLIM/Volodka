import { describe, expect, it } from 'vitest';
import {
  applyExperienceGain,
  experienceRequiredForNextLevel,
  RPG_MAX_CHARACTER_LEVEL,
} from '@/lib/rpgLeveling';

describe('experienceRequiredForNextLevel', () => {
  it('increases with level', () => {
    expect(experienceRequiredForNextLevel(2)).toBeGreaterThanOrEqual(experienceRequiredForNextLevel(1));
  });

  it('returns 0 at cap', () => {
    expect(experienceRequiredForNextLevel(RPG_MAX_CHARACTER_LEVEL)).toBe(0);
  });
});

describe('applyExperienceGain', () => {
  it('accumulates in bucket until level up', () => {
    const need = experienceRequiredForNextLevel(1);
    const r = applyExperienceGain(1, 0, need - 1);
    expect(r.characterLevel).toBe(1);
    expect(r.levelsGained).toBe(0);
    expect(r.experience).toBe(need - 1);
  });

  it('levels up once when crossing threshold', () => {
    const need = experienceRequiredForNextLevel(1);
    const r = applyExperienceGain(1, 0, need);
    expect(r.characterLevel).toBe(2);
    expect(r.levelsGained).toBe(1);
    expect(r.experience).toBe(0);
  });
});
