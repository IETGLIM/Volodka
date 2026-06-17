import { describe, expect, it } from 'vitest';
import type { CombatState } from './types';
import {
  SeededCombatRng,
  createCombatRngState,
  deriveCombatRngSeed,
  getRngState,
  initCombatRngForEncounter,
  rollPlayerDamage,
  setRngSeed,
  withCombatRng,
} from './combatRng';
import { computeDamage } from './formulas';
import { POEM_COMBAT_ABILITIES } from './actions';

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

describe('combat damage reproducibility', () => {
  it('same seed yields the same poem_5 damage sequence', () => {
    const base = minimalCombatState(deriveCombatRngSeed(0x1234, 0, 'system_daemon'));
    const _ability = POEM_COMBAT_ABILITIES.poem_5!;

    const run = (start: CombatState) => {
      const first = rollPlayerDamage(start, { attack: 20, defense: 4, multiplier: 2 });
      const second = rollPlayerDamage(first.state, { attack: 20, defense: 4, multiplier: 2 });
      return [first.damage, second.damage];
    };

    expect(run({ ...base })).toEqual(run({ ...base }));
  });

  it('matches computeDamage when sharing one roll function', () => {
    const rng = SeededCombatRng.fromState(createCombatRngState(55));
    const roll = rng.asRollFn();
    const fromFormula = computeDamage({
      attack: 30,
      defense: 5,
      multiplier: 1.5,
      varianceProfile: 'player',
      rng: roll,
    });
    const fromHelper = rollPlayerDamage(minimalCombatState(55), {
      attack: 30,
      defense: 5,
      multiplier: 1.5,
    });
    expect(fromHelper.damage).toBe(fromFormula);
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
