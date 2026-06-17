/* ─── Combat System — Seeded deterministic RNG ─── */

import type { CombatRngPlayerMeta, CombatRngState } from '@/shared/types/state/combatRng';
import type { EnemyType } from './types';
import type { CombatState } from './types';
import {
  computeDamage,
  type ComputeDamageParams,
} from './formulas';

export type { CombatRngPityState, CombatRngState, CombatRngPlayerMeta } from '@/shared/types/state/combatRng';

export const DEFAULT_RNG_SEED = 0xdea0b33f;

export function createNewGameRngSeed(): number {
  const time = Date.now();
  const perf = typeof performance !== 'undefined' ? performance.now() : 1;
  return (time ^ Math.imul(0x9e3779b9, perf | 0)) >>> 0;
}

export function hashCombineSeeds(...parts: number[]): number {
  let h = 0x811c9dc5;
  for (const part of parts) {
    h ^= part >>> 0;
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function deriveCombatRngSeed(
  baseSeed: number,
  encounterSeq: number,
  enemyType: string,
): number {
  let typeHash = 0;
  for (let i = 0; i < enemyType.length; i++) {
    typeHash = Math.imul(typeHash, 31) + enemyType.charCodeAt(i);
    typeHash >>>= 0;
  }
  return hashCombineSeeds(baseSeed, encounterSeq, typeHash);
}

export function createCombatRngState(seed: number): CombatRngState {
  return {
    state: seed >>> 0,
    rolls: 0,
    pity: { rollsSinceCrit: 0, rollsSinceHit: 0 },
  };
}

export function getPlayerRngSeed(player: CombatRngPlayerMeta): number {
  return player.rngSeed ?? DEFAULT_RNG_SEED;
}

export function getPlayerCombatEncounterSeq(player: CombatRngPlayerMeta): number {
  return player.combatEncounterSeq ?? 0;
}

function mulberry32Step(state: number): { value: number; nextState: number } {
  const nextState = (state + 0x6d2b79f5) >>> 0;
  let t = nextState;
  t = Math.imul(t ^ (t >>> 15), 1 | t);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return { value: ((t ^ (t >>> 14)) >>> 0) / 4294967296, nextState };
}

export class SeededCombatRng {
  private constructor(private mutable: CombatRngState) {}

  static fromState(rngState: CombatRngState): SeededCombatRng {
    return new SeededCombatRng({
      state: rngState.state >>> 0,
      rolls: rngState.rolls,
      pity: { ...rngState.pity },
    });
  }

  nextFloat(): number {
    const step = mulberry32Step(this.mutable.state);
    this.mutable.state = step.nextState;
    this.mutable.rolls += 1;
    this.mutable.pity.rollsSinceCrit += 1;
    return step.value;
  }

  nextInt(min: number, max: number): number {
    const lo = Math.ceil(min);
    const hi = Math.floor(max);
    if (hi <= lo) return lo;
    return lo + Math.floor(this.nextFloat() * (hi - lo + 1));
  }

  roll(chance: number): boolean {
    return this.nextFloat() < chance;
  }

  /** Adapter for formulas.computeDamage `rng` parameter. */
  asRollFn(): () => number {
    return () => this.nextFloat();
  }

  getState(): CombatRngState {
    return {
      state: this.mutable.state,
      rolls: this.mutable.rolls,
      pity: { ...this.mutable.pity },
    };
  }

  /** Mark a successful crit for pity tracking (BLP hook). */
  noteCrit(): void {
    this.mutable.pity.rollsSinceCrit = 0;
  }
}

export function getRngState(state: CombatState): CombatRngState {
  return SeededCombatRng.fromState(state.rng).getState();
}

export function setRngSeed(state: CombatState, seed: number): CombatState {
  return { ...state, rng: createCombatRngState(seed) };
}

export function withCombatRng<T>(
  state: CombatState,
  fn: (rng: SeededCombatRng) => T,
): { result: T; state: CombatState } {
  const rng = SeededCombatRng.fromState(state.rng);
  const result = fn(rng);
  return { result, state: { ...state, rng: rng.getState() } };
}

export function initCombatRngForEncounter(
  player: CombatRngPlayerMeta,
  enemyType: EnemyType,
): CombatRngState {
  const seed = deriveCombatRngSeed(
    getPlayerRngSeed(player),
    getPlayerCombatEncounterSeq(player),
    enemyType,
  );
  return createCombatRngState(seed);
}

type DamageRollParams = Omit<ComputeDamageParams, 'rng' | 'varianceProfile'>;

export function rollPlayerDamage(
  state: CombatState,
  params: DamageRollParams,
): { damage: number; state: CombatState } {
  const rolled = withCombatRng(state, (rng) =>
    computeDamage({ varianceProfile: 'player', ...params, rng: rng.asRollFn() }),
  );
  return { damage: rolled.result, state: rolled.state };
}

export function rollEnemyDamage(
  state: CombatState,
  params: DamageRollParams,
): { damage: number; state: CombatState } {
  const rolled = withCombatRng(state, (rng) =>
    computeDamage({ varianceProfile: 'enemy', ...params, rng: rng.asRollFn() }),
  );
  return { damage: rolled.result, state: rolled.state };
}

/** Deterministic index pick for enemy-type fallback (non-combat context). */
export function pickIndexFromSeed(seed: number, length: number): number {
  if (length <= 0) return 0;
  const rng = SeededCombatRng.fromState(createCombatRngState(seed));
  return Math.floor(rng.nextFloat() * length);
}
