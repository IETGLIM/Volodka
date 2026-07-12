import { describe, expect, it } from 'vitest';
import {
  buildLevelUpAnnouncement,
  buildParticleSpecs,
  formatPerkPointsLabel,
  formatSkillPointsLabel,
  getParticleCountForTier,
} from '@/engine/levelUp/levelUpPresentation';

describe('levelUpPresentation', () => {
  it('uses correct Russian plural forms for skill points', () => {
    expect(formatSkillPointsLabel(1)).toBe('+1 очко навыка');
    expect(formatSkillPointsLabel(2)).toBe('+2 очка навыка');
    expect(formatSkillPointsLabel(5)).toBe('+5 очков навыка');
  });

  it('uses correct Russian plural forms for perk points', () => {
    expect(formatPerkPointsLabel(3)).toBe('+3 очка черты');
  });

  it('builds screen reader announcement', () => {
    const text = buildLevelUpAnnouncement({
      id: 'x',
      newLevel: 5,
      prevLevel: 4,
      levelsGained: 1,
      perkPointsGained: 1,
    });
    expect(text).toContain('Уровень повышен до 5');
    expect(text).toContain('очко навыка');
  });

  it('returns zero particles when reduced motion is enabled', () => {
    expect(getParticleCountForTier('high', true)).toBe(0);
  });

  it('builds stable particle specs', () => {
    const specs = buildParticleSpecs(4);
    expect(specs).toHaveLength(4);
    expect(specs[0]?.variant).toBe('gold');
  });
});
