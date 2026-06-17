import { describe, expect, it } from 'vitest';
import {
  COMBAT_CONSTANTS,
  applyCritMultiplier,
  computeCritChance,
  computeDamage,
  computeDefendedDamage,
  getComboDamageMultiplier,
  rollCritical,
  scaleDamageByFraction,
} from './formulas';

const fixedRng = (value: number) => () => value;

describe('COMBAT_CONSTANTS', () => {
  it('matches legacy variance bands', () => {
    expect(COMBAT_CONSTANTS.PLAYER_DAMAGE_VARIANCE_MIN).toBe(0.9);
    expect(COMBAT_CONSTANTS.PLAYER_DAMAGE_VARIANCE_RANGE).toBe(0.2);
    expect(COMBAT_CONSTANTS.ENEMY_DAMAGE_VARIANCE_MIN).toBe(0.85);
    expect(COMBAT_CONSTANTS.ENEMY_DAMAGE_VARIANCE_RANGE).toBe(0.3);
  });
});

describe('computeDamage', () => {
  it('is deterministic with a fixed RNG seed', () => {
    const params = {
      attack: 20,
      defense: 5,
      multiplier: 2,
      rng: fixedRng(0.5),
    };
    expect(computeDamage(params)).toBe(computeDamage(params));
    // 0.9 + 0.5 * 0.2 = 1.0 → floor((40 - 5) * 1) = 35
    expect(computeDamage(params)).toBe(35);
  });

  it('uses enemy variance profile', () => {
    // 0.85 + 0.5 * 0.3 = 1.0
    expect(
      computeDamage({
        attack: 12,
        multiplier: 1,
        varianceProfile: 'enemy',
        rng: fixedRng(0.5),
      }),
    ).toBe(12);
  });

  it('floors at MIN_DAMAGE when defense exceeds attack', () => {
    expect(
      computeDamage({
        attack: 5,
        defense: 20,
        variance: false,
      }),
    ).toBe(1);
  });

  it('handles zero attack', () => {
    expect(
      computeDamage({
        attack: 0,
        defense: 0,
        variance: false,
      }),
    ).toBe(1);
  });

  it('applies multiplier 2.5 with attack bonus', () => {
    expect(
      computeDamage({
        attack: 10,
        multiplier: 2.5,
        attackBonus: 4,
        variance: false,
      }),
    ).toBe(29);
  });

  it('skips variance when variance=false', () => {
    expect(
      computeDamage({
        attack: 15,
        defense: 3,
        variance: false,
      }),
    ).toBe(12);
  });
});

describe('crit helpers', () => {
  it('caps crit chance at 50%', () => {
    expect(computeCritChance(0)).toBe(0.1);
    expect(computeCritChance(25)).toBe(0.5);
  });

  it('rolls critical deterministically with fixed RNG', () => {
    expect(rollCritical(0, fixedRng(0.05))).toBe(true);
    expect(rollCritical(0, fixedRng(0.5))).toBe(false);
  });

  it('applies crit damage multiplier', () => {
    expect(applyCritMultiplier(10)).toBe(18);
  });
});

describe('combo and defend helpers', () => {
  it('returns combo tier multipliers', () => {
    expect(getComboDamageMultiplier(1)).toBe(1.2);
    expect(getComboDamageMultiplier(2)).toBe(1.5);
    expect(getComboDamageMultiplier(3)).toBe(2);
  });

  it('computes defended damage', () => {
    expect(computeDefendedDamage(20, 10)).toBe(7);
  });

  it('scales damage by reduction and vulnerability', () => {
    expect(scaleDamageByFraction(20, 0.5, 'reduction')).toBe(10);
    expect(scaleDamageByFraction(20, 0.25, 'vulnerability')).toBe(25);
  });
});
