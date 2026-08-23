/* ─── Combat runtime state ─── */

import type { SideEffect } from '../common/effects';
import type {
  CombatBuff,
  CombatEnemy,
  CombatLogEntry,
  CombatReward,
  EnemyChargingSpecial,
} from '../definitions/combat';
import type { CombatRngState } from './combatRng';

export interface CombatState {
  enemy: CombatEnemy;
  playerHp: number;
  playerMaxHp: number;
  turn: number;
  isPlayerTurn: boolean;
  playerDefending: boolean;
  enemyDefending: boolean;
  log: CombatLogEntry[];
  status: 'active' | 'victory' | 'defeat' | 'fled';
  /** Poem powers cooldowns: poemId → turns remaining (0 = available) */
  powerCooldowns: Record<string, number>;
  /** Defense reduction applied to enemy (from poem_1 Правда Глас) */
  enemyDefenseReduction: number;
  /** Double attack active (from poem_6 Слово Мощь) */
  doubleAttack: boolean;
  /** Active buffs/debuffs with duration */
  buffs: CombatBuff[];
  /** Number of failed flee attempts this combat (cumulative +15% per attempt) */
  fleeAttempts: number;
  /** Counter for generating unique buff ids */
  _nextBuffId: number;
  /** Side effects to apply to the Zustand store after computing state transition.
   *  Consumed and cleared by the calling code — never persists in stored state. */
  _sideEffects?: SideEffect[];

  /** Current combo count (consecutive attacks without taking damage) */
  comboCount: number;
  /** Maximum combo achieved this combat (for scoring) */
  maxCombo: number;

  /** Whether the last attack was a critical hit (for UI animation) */
  lastCritical: boolean;

  /** Rewards earned on victory (set when combat ends) */
  rewards?: CombatReward;

  /** IDs of the last two poem powers used, for combo detection */
  lastPoemPowersUsed: [string | null, string | null];
  /** Last poem power used (excluding poem_16 echo) — for poem_16 Эхо Памяти */
  lastUsedPoemId: string | null;

  /** Seeded combat RNG state — advances on each roll for deterministic combat. */
  rng: CombatRngState;

  /** Current boss phase index (see combat/bossPhases.ts; 0 = phase 1).
   *  Undefined for non-boss enemies / legacy states — treated as 0.
   *  Updated by CombatSystem when HP crosses a phase threshold. */
  bossPhase?: number;
  /** Enemy speed BEFORE any boss-phase speed multipliers — phase transitions
   *  re-derive enemy.speed from this base so multipliers never compound. */
  bossBaseSpeed?: number;
}

export type { EnemyChargingSpecial };

export interface EnemySpecialAttack {
  /** Unique identifier */
  readonly id: string;
  /** Display name */
  readonly name: string;
  /** Description shown in combat log */
  readonly description: string;
  /** Chance to use when available (0–1) */
  readonly chance: number;
  /** Minimum turns between uses */
  readonly cooldown: number;
  /** Execute the special attack, returning updated state + optional side effects */
  execute: (state: CombatState, enemy: CombatEnemy) => CombatState;
}
