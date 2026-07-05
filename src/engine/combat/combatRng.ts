/* ─── Combat System — Seeded deterministic RNG ─── */

import type { CombatRngPlayerMeta, CombatRngState } from '@/shared/types/state/combatRng';
import type { EnemyType } from './types';
import type { CombatState } from './types';
import {
  COMBAT_CONSTANTS,
  type ComputeDamageParams,
} from './formulas';

export type { CombatRngPityState, CombatRngState, CombatRngPlayerMeta } from '@/shared/types/state/combatRng';

export const COMBAT_PITY = {
  /** Rolls without crit before soft pity bonus begins. */
  CRIT_SOFT_START: 6,
  /** Added crit chance per roll after soft start (until hard guarantee). */
  CRIT_CHANCE_PER_ROLL: 0.04,
  /** Guaranteed crit on this many consecutive non-crit attempts. */
  CRIT_HARD_GUARANTEE: 14,
  /** Low damage variance rolls before minimum variance pity kicks in. */
  VARIANCE_SOFT_START: 8,
  /** Minimum variance factor boost per low roll. */
  VARIANCE_FLOOR_BONUS: 0.03,
} as const;

export function computeCritChanceWithPity(
  baseChance: number,
  rollsSinceCrit: number,
): number {
  if (rollsSinceCrit >= COMBAT_PITY.CRIT_HARD_GUARANTEE) return 1;
  const extraRolls = Math.max(0, rollsSinceCrit - COMBAT_PITY.CRIT_SOFT_START);
  return Math.min(1, baseChance + extraRolls * COMBAT_PITY.CRIT_CHANCE_PER_ROLL);
}

export function computeVarianceFloorWithPity(
  profile: 'player' | 'enemy',
  rollsSinceLowVariance: number,
): number {
  const baseMin =
    profile === 'player'
      ? COMBAT_CONSTANTS.PLAYER_DAMAGE_VARIANCE_MIN
      : COMBAT_CONSTANTS.ENEMY_DAMAGE_VARIANCE_MIN;
  const extraRolls = Math.max(0, rollsSinceLowVariance - COMBAT_PITY.VARIANCE_SOFT_START);
  const bonus = extraRolls * COMBAT_PITY.VARIANCE_FLOOR_BONUS;
  return Math.min(1, baseMin + bonus);
}

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
    return step.value;
  }

  /** Crit roll with soft/hard pity — increments rollsSinceCrit on miss. */
  rollCritical(baseChance: number): boolean {
    const effective = computeCritChanceWithPity(baseChance, this.mutable.pity.rollsSinceCrit);
    const roll = this.nextFloat();
    const isCrit = roll < effective;
    if (isCrit) {
      this.mutable.pity.rollsSinceCrit = 0;
      this.mutable.pity.rollsSinceHit = 0;
    } else {
      this.mutable.pity.rollsSinceCrit += 1;
      this.mutable.pity.rollsSinceHit += 1;
    }
    return isCrit;
  }

  /** Damage variance roll with anti-bad-luck floor pity. */
  rollVarianceFactor(profile: 'player' | 'enemy'): number {
    const varianceMin = computeVarianceFloorWithPity(profile, this.mutable.pity.rollsSinceHit);
    const varianceRange =
      profile === 'player'
        ? COMBAT_CONSTANTS.PLAYER_DAMAGE_VARIANCE_RANGE
        : COMBAT_CONSTANTS.ENEMY_DAMAGE_VARIANCE_RANGE;
    const roll = this.nextFloat();
    const factor = varianceMin + roll * varianceRange;
    const baseMin =
      profile === 'player'
        ? COMBAT_CONSTANTS.PLAYER_DAMAGE_VARIANCE_MIN
        : COMBAT_CONSTANTS.ENEMY_DAMAGE_VARIANCE_MIN;
    const lowThreshold = baseMin + varianceRange * 0.2;
    if (factor < lowThreshold) {
      this.mutable.pity.rollsSinceHit += 1;
    } else {
      this.mutable.pity.rollsSinceHit = 0;
    }
    return factor;
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

  /** Core damage roll with variance pity applied. */
  rollDamage(params: Omit<ComputeDamageParams, 'rng'>): number {
    const {
      attack,
      defense = 0,
      multiplier = 1,
      attackBonus = 0,
      varianceProfile = 'player',
      variance = true,
      minDamage = COMBAT_CONSTANTS.MIN_DAMAGE,
    } = params;
    const raw = attack * multiplier + attackBonus - defense;
    const factor = variance ? this.rollVarianceFactor(varianceProfile) : 1;
    return Math.max(minDamage, Math.floor(raw * factor));
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
    rng.rollDamage({ varianceProfile: 'player', ...params }),
  );
  return { damage: rolled.result, state: rolled.state };
}

export function rollEnemyDamage(
  state: CombatState,
  params: DamageRollParams,
): { damage: number; state: CombatState } {
  const rolled = withCombatRng(state, (rng) =>
    rng.rollDamage({ varianceProfile: 'enemy', ...params }),
  );
  return { damage: rolled.result, state: rolled.state };
}

/** Deterministic index pick for enemy-type fallback (non-combat context). */
export function pickIndexFromSeed(seed: number, length: number): number {
  if (length <= 0) return 0;
  const rng = SeededCombatRng.fromState(createCombatRngState(seed));
  return Math.floor(rng.nextFloat() * length);
}
