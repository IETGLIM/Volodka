/* ─── Combat System — Formulas: damage, defense, flee, player stats ─── */

import type { CombatState } from './types';
import { dispatchGameAction, getGameSnapshot } from '@/engine/GameActionDispatcher';
import { resolveCombatPerkModifiers } from '@/shared/perks/perkModifiers';
import { resolveThoughtCombatEffects, type ThoughtCombatEffect } from './thoughtCombatModifiers';
import { THOUGHT_CABINET_MAP } from '@/data/thoughtCabinet';

/* ═══════════════════════════════════════════════════════════════
   Damage formulas — centralized combat math
   ═══════════════════════════════════════════════════════════════ */

export const COMBAT_CONSTANTS = {
  MIN_DAMAGE: 1,
  PLAYER_DAMAGE_VARIANCE_MIN: 0.9,
  PLAYER_DAMAGE_VARIANCE_RANGE: 0.2,
  ENEMY_DAMAGE_VARIANCE_MIN: 0.85,
  ENEMY_DAMAGE_VARIANCE_RANGE: 0.3,
  CRIT_BASE_CHANCE: 0.1,
  CRIT_WRITING_SKILL_BONUS: 0.02,
  CRIT_MAX_CHANCE: 0.5,
  CRIT_DAMAGE_MULTIPLIER: 1.8,
  STEALTH_CRIT_MULTIPLIER: 2,
  COMBO_DAMAGE_MULTIPLIER_1: 1.2,
  COMBO_DAMAGE_MULTIPLIER_2: 1.5,
  COMBO_DAMAGE_MULTIPLIER_3: 2,
  COMBO_DAMAGE_MULTIPLIER_4: 2.5,  // Tier-4: sustained aggression reward
  DEFEND_DAMAGE_FACTOR: 0.5,
  DEFEND_DEFENSE_FACTOR: 0.3,
  SPIRITUAL_DAMAGE_REDUCTION_PER_LEVEL: 0.05,
  POEM_HUNTER_DAMAGE_BASE_MULTIPLIER: 1.5,
  POEM_HUNTER_DAMAGE_PER_POEM: 0.1,
  COMBO_ISTINA_DEFENSE_FACTOR: 0.5,
} as const;

export type DamageVarianceProfile = 'player' | 'enemy';

/** Returns a uniform value in [0, 1). Override for deterministic combat rolls. */
export type CombatRng = () => number;

export function defaultCombatRng(): number {
  return Math.random();
}

export interface ComputeDamageParams {
  attack: number;
  defense?: number;
  multiplier?: number;
  /** Added to (attack × multiplier) before subtracting defense. */
  attackBonus?: number;
  varianceProfile?: DamageVarianceProfile;
  variance?: boolean;
  rng?: CombatRng;
  minDamage?: number;
}

/** Core damage roll: floor((attack × mult + bonus − defense) × variance), min 1. */
export function computeDamage(params: ComputeDamageParams): number {
  const {
    attack,
    defense = 0,
    multiplier = 1,
    attackBonus = 0,
    varianceProfile = 'player',
    variance = true,
    rng = defaultCombatRng,
    minDamage = COMBAT_CONSTANTS.MIN_DAMAGE,
  } = params;

  const raw = attack * multiplier + attackBonus - defense;
  let factor = 1;
  if (variance) {
    const varianceMin =
      varianceProfile === 'player'
        ? COMBAT_CONSTANTS.PLAYER_DAMAGE_VARIANCE_MIN
        : COMBAT_CONSTANTS.ENEMY_DAMAGE_VARIANCE_MIN;
    const varianceRange =
      varianceProfile === 'player'
        ? COMBAT_CONSTANTS.PLAYER_DAMAGE_VARIANCE_RANGE
        : COMBAT_CONSTANTS.ENEMY_DAMAGE_VARIANCE_RANGE;
    factor = varianceMin + rng() * varianceRange;
  }

  return Math.max(minDamage, Math.floor(raw * factor));
}

export function computeCritChance(writingSkill: number): number {
  return Math.min(
    COMBAT_CONSTANTS.CRIT_MAX_CHANCE,
    COMBAT_CONSTANTS.CRIT_BASE_CHANCE + writingSkill * COMBAT_CONSTANTS.CRIT_WRITING_SKILL_BONUS,
  );
}

/** Player crit chance including thought bonuses (intuition → +3% per thought).
 *  Wraps computeCritChance and adds thought crit bonus (as percentage). */
export function getPlayerCritChance(): number {
  const s = snap();
  const baseChance = computeCritChance(s.playerState.skills.writing);
  const thoughtEffects = resolveThoughtEffects();
  // critChanceBonus is in percentage points (e.g. 3 = 3%), convert to 0–1 range.
  return Math.min(
    COMBAT_CONSTANTS.CRIT_MAX_CHANCE,
    baseChance + thoughtEffects.critChanceBonus / 100,
  );
}

export function rollCritical(writingSkill: number, rng: CombatRng = defaultCombatRng): boolean {
  return rng() < computeCritChance(writingSkill);
}

export function applyCritMultiplier(damage: number): number {
  return Math.floor(damage * COMBAT_CONSTANTS.CRIT_DAMAGE_MULTIPLIER);
}

export function getComboDamageMultiplier(comboCount: number): number {
  if (comboCount >= 4) return COMBAT_CONSTANTS.COMBO_DAMAGE_MULTIPLIER_4;  // Sustained aggression
  if (comboCount >= 3) return COMBAT_CONSTANTS.COMBO_DAMAGE_MULTIPLIER_3;
  if (comboCount >= 2) return COMBAT_CONSTANTS.COMBO_DAMAGE_MULTIPLIER_2;
  if (comboCount >= 1) return COMBAT_CONSTANTS.COMBO_DAMAGE_MULTIPLIER_1;
  return 1;
}

export function computeDefendedDamage(baseDamage: number, playerDefense: number): number {
  return Math.max(
    COMBAT_CONSTANTS.MIN_DAMAGE,
    Math.floor(
      baseDamage * COMBAT_CONSTANTS.DEFEND_DAMAGE_FACTOR -
        playerDefense * COMBAT_CONSTANTS.DEFEND_DEFENSE_FACTOR,
    ),
  );
}

/** Scales outgoing damage by a fractional reduction (0–1) or vulnerability bonus (0+). */
export function scaleDamageByFraction(
  damage: number,
  fraction: number,
  mode: 'reduction' | 'vulnerability',
): number {
  if (fraction <= 0) return damage;
  const factor = mode === 'reduction' ? 1 - fraction : 1 + fraction;
  return Math.max(COMBAT_CONSTANTS.MIN_DAMAGE, Math.floor(damage * factor));
}

function snap() {
  return getGameSnapshot();
}

/** Resolve equipped thought combat effects from the current game state.
 *  Reads equippedThoughtIds from the snapshot and maps them to
 *  ThoughtCabinetItem definitions using THOUGHT_CABINET_MAP. */
function resolveThoughtEffects(): ThoughtCombatEffect {
  const s = snap();
  const equippedThoughts = (s.playerState.equippedThoughtIds ?? [])
    .map((id) => THOUGHT_CABINET_MAP[id])
    .filter(Boolean);
  return resolveThoughtCombatEffects(equippedThoughts);
}

export function getPlayerAttack(): number {
  const s = snap();
  const { skills } = s.playerState;
  const base = skills.coding + skills.logic;
  // Perk flat attack bonus (e.g. code_rage +4 when stress > 60).
  const perks = resolveCombatPerkModifiers(s.playerState.progression?.unlockedPerks ?? [], {
    stress: s.playerState.stress,
    timeOfDay: s.exploration?.timeOfDay,
  });
  // Thought combat bonus (e.g. coding thoughts → +0.4 attack per thought).
  const thoughtEffects = resolveThoughtEffects();
  return base + perks.flatAttackBonus + thoughtEffects.attackBonus;
}

export function getPlayerDefense(): number {
  const s = snap();
  const { skills, energy } = s.playerState;
  const base = skills.empathy + Math.floor(energy / 10);
  // Perk flat defense bonus (e.g. combat_meditation +3 when stress < 30).
  const perks = resolveCombatPerkModifiers(s.playerState.progression?.unlockedPerks ?? [], {
    stress: s.playerState.stress,
    timeOfDay: s.exploration?.timeOfDay,
  });
  // Thought combat bonus (e.g. logic thoughts → +0.3 defense per thought).
  const thoughtEffects = resolveThoughtEffects();
  return Math.floor(base * perks.defenseMultiplier) + perks.flatDefenseBonus + thoughtEffects.defenseBonus;
}

export function getPlayerMaxHp(): number {
  const s = snap();
  const { energy, progression } = s.playerState;
  const level = progression?.level ?? 1;
  // Base HP from level prevents death spiral when energy is drained:
  // even at 0 energy, player retains level-scaled base HP.
  const baseFromLevel = 20 + (level - 1) * 5;
  const fromEnergy = energy * 2;
  // Thought combat bonus (e.g. writing thoughts → +5 HP per thought).
  const thoughtEffects = resolveThoughtEffects();
  return Math.max(baseFromLevel, fromEnergy) + thoughtEffects.hpBonus;
}

/** Credits earned on combat victory — scales with enemy tier and combo. */
export function computeCombatCredits(xpReward: number, comboBonus: number): number {
  return Math.max(8, Math.floor(xpReward * 0.5) + comboBonus * 2);
}

export function tickPowerCooldowns(cooldowns: Record<string, number>): Record<string, number> {
  const updated: Record<string, number> = {};
  for (const [id, cd] of Object.entries(cooldowns)) {
    const remaining = cd - 1;
    if (remaining > 0) updated[id] = remaining;
  }
  return updated;
}

export function isPowerAvailable(poemId: string, state: CombatState): boolean {
  if (!snap().collectedPoems.includes(poemId)) return false;
  if ((state.powerCooldowns[poemId] ?? 0) > 0) return false;
  return true;
}

/** Thought-derived flee chance bonus (empathy → +5% per thought).
 *  Returns percentage points to add to the flee chance calculation.
 *  CombatSystem should add this to its flee chance formula. */
export function getPlayerThoughtFleeBonus(): number {
  return resolveThoughtEffects().fleeChanceBonus;
}

/** Thought-derived combo multiplier bonus (persuasion → +0.1, rhythm → +0.05).
 *  Returns additive bonus to the combo damage multiplier.
 *  CombatSystem should add this to its combo multiplier calculation. */
export function getPlayerThoughtComboMultiplierBonus(): number {
  return resolveThoughtEffects().comboMultiplier;
}

export { calculateXpToNextLevel } from '@/shared/progression/xp';

export function addXp(amount: number): void {
  dispatchGameAction({ type: 'player/addXp', amount });
}
