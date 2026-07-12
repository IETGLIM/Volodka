import { describe, expect, it } from 'vitest';
import {
  computeXpProgressPct,
  getEnergyColor,
  getKarmaRingColor,
  getSkillBarFillPct,
  getStressColor,
  isVitalHighWarning,
  isVitalLowWarning,
} from '@/engine/playerStats/playerStatsPanelPresentation';

describe('playerStatsPanelPresentation', () => {
  it('computes xp progress percentage', () => {
    expect(computeXpProgressPct(25, 100)).toBe(25);
    expect(computeXpProgressPct(150, 100)).toBe(100);
    expect(computeXpProgressPct(10, 0)).toBe(0);
  });

  it('resolves karma ring colors by threshold', () => {
    expect(getKarmaRingColor(80)).toBe('#34d399');
    expect(getKarmaRingColor(40)).toBe('var(--cyber-cyan)');
    expect(getKarmaRingColor(10)).toBe('#fb7185');
  });

  it('resolves vital colors and warnings', () => {
    expect(getEnergyColor(10)).toBe('#fb7185');
    expect(getEnergyColor(80)).toBe('var(--cyber-cyan)');
    expect(getStressColor(80)).toBe('#fb7185');
    expect(isVitalLowWarning(20)).toBe(true);
    expect(isVitalHighWarning(75)).toBe(true);
  });

  it('caps skill bar fill at 100%', () => {
    expect(getSkillBarFillPct(25)).toBe(50);
    expect(getSkillBarFillPct(100)).toBe(100);
  });
});
