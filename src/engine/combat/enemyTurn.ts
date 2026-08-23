/* ─── Combat System — Enemy Turn Logic (pure functions) ───
 *
 * Extracted from CombatSystem.ts (§8) to reduce the orchestrator's size.
 * All functions here are **pure** — they take inputs and return results
 * without touching the combat singleton, event bus, or game store.
 *
 * The orchestrator (CombatSystem.ts) calls these and applies side effects
 * (setState, eventBus, dispatchGameAction) itself.
 */

import type { CombatState } from './types';
import {
  getPlayerDefense,
  computeDefendedDamage,
  scaleDamageByFraction,
  COMBAT_CONSTANTS,
} from './formulas';
import {
  hasBuffEffect,
  getPlayerDamageReduction,
  getPlayerVulnerability,
  getPlayerDefenseBoost,
} from './buffSystem';
import {
  getEnemyAttackBoost,
  getEnemyDamageMultiplier,
} from './buffSystem';
import { computeDamage } from './formulas';
import { scaleEnemyDamageByDifficulty } from './combatDifficulty';
import { getBossPhaseDamageMultiplier } from './bossPhases';
import type { SeededCombatRng } from './combatRng';
import type { CombatPerkModifiers } from '@/shared/perks/perkModifiers';

/* ═══════════════════════════════════════════════════════════════
   §8.1 — Incoming Damage Pipeline
   ═══════════════════════════════════════════════════════════════ */

/** Context required to compute the final incoming damage to the player. */
export interface IncomingDamageParams {
  /** Current combat state (used for buff queries). */
  combatState: CombatState;
  /** Pre-rolled RNG instance (caller creates from combatState.rng). */
  rng: SeededCombatRng;
  /** Current game act (for difficulty scaling). */
  currentAct: number;
  /** Current player level (for difficulty scaling). */
  currentLevel: number;
  /** Number of unlocked spirit_ skills (spiritual damage reduction). */
  spiritualSkillCount: number;
  /** Resolved perk modifiers (caller resolves from game snapshot). */
  perkMods: CombatPerkModifiers;
}

/** Shared defense-layer context (layers 3–8 of the incoming-damage pipeline). */
interface DefenseLayerParams {
  combatState: CombatState;
  spiritualSkillCount: number;
  perkMods: CombatPerkModifiers;
}

/** Apply the player-defense layers to a pre-computed incoming damage value.
 *
 * Layers (applied in order, mirrors computeEnemyIncomingDamage):
 *  1. Player defending → defended damage
 *  2. Player defense boost buff → flat reduction
 *  3. Player damage_reduction buff → fractional reduction
 *  4. Player vulnerability buff → fractional amplification
 *  5. Spiritual skills → fractional reduction (5% per level)
 *  6. Perk incoming damage reduction → fractional reduction
 */
function applyPlayerDefenseLayers(
  damage: number,
  { combatState: cs, spiritualSkillCount, perkMods }: DefenseLayerParams,
): number {
  // Layer 3: Player defending (damage_reduction buff)
  if (hasBuffEffect(cs, 'player', 'damage_reduction')) {
    const playerDef = getPlayerDefense();
    damage = computeDefendedDamage(damage, playerDef);
  }

  // Layer 4: Defense boost buff
  const playerDefBoost = getPlayerDefenseBoost(cs);
  if (playerDefBoost > 0) {
    damage = Math.max(1, damage - playerDefBoost);
  }

  // Layer 5: Damage reduction buff
  const playerDmgReduction = getPlayerDamageReduction(cs);
  if (playerDmgReduction > 0) {
    damage = scaleDamageByFraction(damage, playerDmgReduction, 'reduction');
  }

  // Layer 6: Vulnerability amplification
  const playerVulnerability = getPlayerVulnerability(cs);
  if (playerVulnerability > 0) {
    damage = scaleDamageByFraction(damage, playerVulnerability, 'vulnerability');
  }

  // Layer 7: Spiritual skill reduction
  if (spiritualSkillCount > 0) {
    damage = scaleDamageByFraction(
      damage,
      spiritualSkillCount * COMBAT_CONSTANTS.SPIRITUAL_DAMAGE_REDUCTION_PER_LEVEL,
      'reduction',
    );
  }

  // Layer 8: Perk incoming damage reduction
  if (perkMods.incomingDamageReduction > 0) {
    damage = scaleDamageByFraction(
      damage,
      perkMods.incomingDamageReduction,
      'reduction',
    );
  }

  return damage;
}

/**
 * Compute the final damage the enemy deals to the player.
 *
 * Pipeline (applied in order):
 *  1. Base damage from enemy attack + buffs
 * 2. Difficulty scaling (act/level)
 * 2b. Boss phase damage multiplier (bossPhases.ts — ×1.0..×1.6, bosses only)
 *  3. Player defending → defended damage
 *  4. Player defense boost buff → flat reduction
 *  5. Player damage_reduction buff → fractional reduction
 *  6. Player vulnerability buff → fractional amplification
 *  7. Spiritual skills → fractional reduction (5% per level)
 *  8. Perk incoming damage reduction → fractional reduction (capped at 0.8 total)
 *
 * Returns `{ damage, rng }` — the caller must use the updated RNG state.
 */
export function computeEnemyIncomingDamage(params: IncomingDamageParams): {
  damage: number;
  rng: SeededCombatRng;
} {
  const { combatState: cs, rng, currentAct, currentLevel, spiritualSkillCount, perkMods } = params;

  const enemyAtkBoost = getEnemyAttackBoost(cs);
  const effectiveEnemyAttack = cs.enemy.attack + enemyAtkBoost;
  const enemyDmgMultiplier = getEnemyDamageMultiplier(cs);

  let damage = computeDamage({
    attack: effectiveEnemyAttack,
    multiplier: enemyDmgMultiplier,
    varianceProfile: 'enemy',
    rng: rng.asRollFn(),
  });

  damage = scaleEnemyDamageByDifficulty(damage, undefined, currentAct, currentLevel);
  // Note: the user-facing 5-level difficulty multiplier is now applied inside
  // scaleEnemyDamageByDifficulty (via the registered difficultySlice getter), so
  // it scales BOTH basic attacks AND boss specials uniformly. Previously this
  // was a separate second application that only basic attacks received, leaving
  // boss specials unscaled by the user's chosen difficulty.

  // Boss phase multiplier (×1.0 for non-boss enemies — no behavior change).
  const bossPhaseMultiplier = getBossPhaseDamageMultiplier(cs.enemy);
  if (bossPhaseMultiplier !== 1) {
    damage = Math.max(1, Math.floor(damage * bossPhaseMultiplier));
  }

  damage = applyPlayerDefenseLayers(damage, { combatState: cs, spiritualSkillCount, perkMods });

  return { damage, rng };
}

/* ═══════════════════════════════════════════════════════════════
   §8.1b — Special-Attack Incoming Damage Pipeline
   ═══════════════════════════════════════════════════════════════ */

/** Context required to route a special attack's raw damage through the
 *  player-defense pipeline (task 3.3-b1: «Защита» and buffs must work
 *  against specials — previously boss specials dealt raw damage). */
export interface SpecialIncomingDamageParams {
  /** Current combat state (used for buff queries + boss phase lookup). */
  combatState: CombatState;
  /** Raw special damage BEFORE player defenses — the caller has already
   *  applied its own offensive formula (base + enemy.attack, difficulty /
   *  act / level scaling). Re-applying those here would double-scale. */
  rawDamage: number;
  /** Number of unlocked spirit_ skills (spiritual damage reduction). */
  spiritualSkillCount: number;
  /** Resolved perk modifiers (caller resolves from game snapshot). */
  perkMods: CombatPerkModifiers;
  /** True when executing a CHARGED (telegraphed) special — defending players
   *  get the counter-window bonus (extra ×TELEGRAPH_DEFEND_DAMAGE_FACTOR). */
  telegraphed?: boolean;
}

/**
 * Compute the final damage a special attack deals to the player.
 *
 * Pipeline (applied in order):
 *  1. Boss phase damage multiplier (bossPhases.ts — ×1.0 for non-bosses)
 *  2. Player defending → defended damage
 *  3. Player defense boost buff → flat reduction
 *  4. Player damage_reduction buff → fractional reduction
 *  5. Player vulnerability buff → fractional amplification
 *  6. Spiritual skills / perk reductions
 *  7. Telegraph counter-window: if the special was CHARGED and the player is
 *     defending, multiply by TELEGRAPH_DEFEND_DAMAGE_FACTOR (0.4).
 *
 * Returns `{ damage, playerDefending }` — the flag lets callers annotate the
 * combat log. No RNG is consumed here: the caller pre-rolls any variance
 * into `rawDamage`.
 */
export function computeSpecialIncomingDamage(params: SpecialIncomingDamageParams): {
  damage: number;
  playerDefending: boolean;
} {
  const { combatState: cs, rawDamage, spiritualSkillCount, perkMods, telegraphed } = params;

  // Boss phase multiplier (×1.0 for non-boss enemies — no behavior change).
  const bossPhaseMultiplier = getBossPhaseDamageMultiplier(cs.enemy);
  let damage = Math.max(1, Math.floor(rawDamage * bossPhaseMultiplier));

  const playerDefending = hasBuffEffect(cs, 'player', 'damage_reduction');

  damage = applyPlayerDefenseLayers(damage, { combatState: cs, spiritualSkillCount, perkMods });

  // Telegraph counter-window: a well-timed Defend against a charged special
  // cuts through even the heaviest boss nukes.
  if (telegraphed && playerDefending) {
    damage = Math.max(
      COMBAT_CONSTANTS.MIN_DAMAGE,
      Math.floor(damage * COMBAT_CONSTANTS.TELEGRAPH_DEFEND_DAMAGE_FACTOR),
    );
  }

  return { damage, playerDefending };
}

/* ═══════════════════════════════════════════════════════════════
   §8.2 — Stat Drain Resolution
   ═══════════════════════════════════════════════════════════════ */

/**
 * A stat drain action to be dispatched by the orchestrator.
 * Using a discriminated union instead of raw dispatchGameAction calls
 * keeps this module pure and testable.
 */
export type StatDrainAction =
  | { type: 'player/addSkill'; skill: 'logic' | 'empathy'; amount: number }
  | { type: 'player/addEnergy'; amount: number }
  | { type: 'player/addKarma'; amount: number };

/** Stat drain probabilities per target type. */
const STAT_DRAIN_CHANCE: Record<string, number> = {
  logic: 0.3,
  energy: 0.4,
  karma: 0.3,
  empathy: 0.3,
};

/** Stat drain magnitudes per target type. */
const STAT_DRAIN_MAGNITUDE: Record<string, StatDrainAction['amount']> = {
  logic: -1,
  empathy: -1,
  energy: -5,
  karma: -3,
};

/** Human-readable labels for log entries. */
const STAT_DRAIN_LABEL: Record<string, string> = {
  logic: ' Логика -1!',
  empathy: ' Эмпатия -1!',
  energy: ' Энергия -5!',
  karma: ' Карма -3!',
};

/**
 * Resolve the enemy's stat drain side effect for a basic attack.
 *
 * Returns `{ action, label }` if the drain triggers, or `{ action: null, label: '' }` if not.
 * The orchestrator dispatches `action` via `dispatchGameAction` and appends `label` to the log.
 */
export function resolveStatDrain(
  targetsStat: string | undefined,
  rng: SeededCombatRng,
): { action: StatDrainAction | null; label: string } {
  if (!targetsStat || !(targetsStat in STAT_DRAIN_CHANCE)) {
    return { action: null, label: '' };
  }

  const chance = STAT_DRAIN_CHANCE[targetsStat];
  if (!rng.roll(chance)) {
    return { action: null, label: '' };
  }

  const magnitude = STAT_DRAIN_MAGNITUDE[targetsStat];
  const label = STAT_DRAIN_LABEL[targetsStat];

  let action: StatDrainAction;
  if (targetsStat === 'logic' || targetsStat === 'empathy') {
    action = { type: 'player/addSkill', skill: targetsStat, amount: magnitude };
  } else if (targetsStat === 'energy') {
    action = { type: 'player/addEnergy', amount: magnitude };
  } else {
    action = { type: 'player/addKarma', amount: magnitude };
  }

  return { action, label };
}
