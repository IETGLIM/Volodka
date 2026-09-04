/* ─── v4.8.8: тесты наград за добивание крипа (rewards.ts §9.3) ───
 * Проверяются: масштаб XP 0.6 с полом 1, фиксированная карма, кредиты по
 * боевой формуле с множителем сложности и защитой от нечисловых значений,
 * минимум 1 кредит. */

import { describe, expect, it } from 'vitest';
import {
  CREEP_FINISHER_KARMA,
  CREEP_FINISHER_XP_SCALE,
  computeCreepFinisherRewards,
} from '@/engine/combat/rewards';

describe('computeCreepFinisherRewards (v4.8.8)', () => {
  it('scales xp to 60% of the template reward', () => {
    expect(CREEP_FINISHER_XP_SCALE).toBe(0.6);
    // floor(25 * 0.6) = 15 — как у system_daemon.
    const r = computeCreepFinisherRewards({ xpReward: 25, creditsMultiplier: 1 });
    expect(r.xpGained).toBe(15);
  });

  it('guarantees at least 1 xp', () => {
    const r = computeCreepFinisherRewards({ xpReward: 0, creditsMultiplier: 1 });
    expect(r.xpGained).toBe(1);
    const negative = computeCreepFinisherRewards({ xpReward: -30, creditsMultiplier: 1 });
    expect(negative.xpGained).toBe(1);
  });

  it('pays fixed karma without combat combo bonuses', () => {
    expect(CREEP_FINISHER_KARMA).toBe(2);
    const r = computeCreepFinisherRewards({ xpReward: 40, creditsMultiplier: 1.5 });
    expect(r.karmaGained).toBe(2);
  });

  it('credits follow the combat formula times the difficulty multiplier', () => {
    const base = computeCreepFinisherRewards({ xpReward: 25, creditsMultiplier: 1 });
    const boosted = computeCreepFinisherRewards({ xpReward: 25, creditsMultiplier: 2 });
    expect(boosted.creditsGained).toBeGreaterThanOrEqual(base.creditsGained);
    expect(Number.isInteger(base.creditsGained)).toBe(true);
    expect(base.creditsGained).toBeGreaterThanOrEqual(1);
  });

  it('falls back to multiplier 1 on non-finite input and never pays 0', () => {
    const r = computeCreepFinisherRewards({
      xpReward: 25,
      creditsMultiplier: Number.NaN,
    });
    expect(Number.isFinite(r.creditsGained)).toBe(true);
    expect(r.creditsGained).toBeGreaterThanOrEqual(1);
  });
});
