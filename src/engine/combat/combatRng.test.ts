import { describe, expect, it } from 'vitest';
import type { CombatState } from './types';
import {
  SeededCombatRng,
  COMBAT_PITY,
  computeCritChanceWithPity,
  createCombatRngState,
  deriveCombatRngSeed,
  getRngState,
  initCombatRngForEncounter,
  rollPlayerDamage,
  setRngSeed,
  withCombatRng,
} from './combatRng';

function minimalCombatState(rngSeed = 42): CombatState {
  return {
    rng: createCombatRngState(rngSeed),
  } as CombatState;
}

describe('SeededCombatRng', () => {
  it('produces identical sequences for the same seed', () => {
    const a = SeededCombatRng.fromState(createCombatRngState(0xabc123));
    const b = SeededCombatRng.fromState(createCombatRngState(0xabc123));

    const seqA = Array.from({ length: 5 }, () => a.nextFloat());
    const seqB = Array.from({ length: 5 }, () => b.nextFloat());

    expect(seqA).toEqual(seqB);
    expect(seqA.every((v) => v >= 0 && v < 1)).toBe(true);
  });

  it('advances state deterministically across rolls', () => {
    const rng = SeededCombatRng.fromState(createCombatRngState(7));
    const before = rng.getState().rolls;
    rng.nextFloat();
    rng.roll(0.5);
    rng.nextInt(0, 9);
    expect(rng.getState().rolls).toBe(before + 3);
  });

  it('getRngState and setRngSeed round-trip through combat state', () => {
    const state = minimalCombatState(99);
    const rolled = withCombatRng(state, (rng) => rng.nextFloat());
    expect(getRngState(rolled.state).rolls).toBe(1);
    expect(setRngSeed(state, 0xfeedface).rng.state).toBe(0xfeedface);
  });
});

describe('combat pity', () => {
  it('ramps crit chance after soft pity threshold', () => {
    expect(computeCritChanceWithPity(0.1, COMBAT_PITY.CRIT_SOFT_START)).toBe(0.1);
    expect(computeCritChanceWithPity(0.1, COMBAT_PITY.CRIT_SOFT_START + 1)).toBeCloseTo(0.14);
    expect(computeCritChanceWithPity(0.1, COMBAT_PITY.CRIT_HARD_GUARANTEE)).toBe(1);
  });

  it('guarantees a crit after enough failed attempts', () => {
    const forced = SeededCombatRng.fromState({
      ...createCombatRngState(0xabc),
      pity: { rollsSinceCrit: COMBAT_PITY.CRIT_HARD_GUARANTEE, rollsSinceHit: 0 },
    });
    expect(forced.rollCritical(0.01)).toBe(true);
  });
});

describe('combat damage reproducibility', () => {
  it('same seed yields the same poem_5 damage sequence', () => {
    const base = minimalCombatState(deriveCombatRngSeed(0x1234, 0, 'system_daemon'));

    const run = (start: CombatState) => {
      const first = rollPlayerDamage(start, { attack: 20, defense: 4, multiplier: 2 });
      const second = rollPlayerDamage(first.state, { attack: 20, defense: 4, multiplier: 2 });
      return [first.damage, second.damage];
    };

    expect(run({ ...base })).toEqual(run({ ...base }));
  });

  it('rollDamage is deterministic for the same seed', () => {
    const run = () => {
      const rng = SeededCombatRng.fromState(createCombatRngState(55));
      return rng.rollDamage({
        attack: 30,
        defense: 5,
        multiplier: 1.5,
        varianceProfile: 'player',
      });
    };
    expect(run()).toBe(run());
  });
});

describe('initCombatRngForEncounter', () => {
  it('derives different state per encounter sequence', () => {
    const player = {
      rngSeed: 0xdeadbeef,
      combatEncounterSeq: 0,
    } as import('@/shared/types/game').PlayerState;

    const first = initCombatRngForEncounter(player, 'system_daemon');
    const second = initCombatRngForEncounter(
      { ...player, combatEncounterSeq: 1 },
      'system_daemon',
    );

    expect(first.state).not.toBe(second.state);
    expect(deriveCombatRngSeed(0xdeadbeef, 0, 'system_daemon')).toBe(first.state);
  });
});
