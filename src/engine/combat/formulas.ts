/* ─── Combat System — Formulas: damage, defense, flee, player stats ─── */

import type { CombatState } from './types';
import type { TrainablePlayerSkill } from '@/shared/types/game';
import { dispatchGameAction, getGameSnapshot } from '@/engine/GameActionDispatcher';
import { calculateXpToNextLevel as storeCalculateXpToNextLevel } from '@/store/shared';

function snap() {
  return getGameSnapshot();
}

export function getPlayerAttack(): number {
  const { skills } = snap().playerState;
  return skills.coding + skills.logic;
}

export function getPlayerDefense(): number {
  const { skills, energy } = snap().playerState;
  return skills.empathy + Math.floor(energy / 10);
}

export function getPlayerMaxHp(): number {
  const { energy } = snap().playerState;
  return Math.max(20, energy * 2);
}

/** Credits earned on combat victory — scales with enemy tier and combo. */
export function computeCombatCredits(xpReward: number, comboBonus: number): number {
  return Math.max(8, Math.floor(xpReward * 0.5) + comboBonus * 2);
}

/** Consecutive-attack combo damage multiplier (behavior-identical to CombatSystem). */
export function getComboMultiplier(comboCount: number): number {
  if (comboCount >= 3) return 2.0;
  if (comboCount >= 2) return 1.5;
  if (comboCount >= 1) return 1.2;
  return 1.0;
}

/** Crit chance: 10% base + writing×2%, capped at 50%. */
export function getCritChance(writingSkill: number): number {
  return Math.min(0.5, 0.10 + writingSkill * 0.02);
}

/** Standard attack damage variance band [0.85, 1.15). */
export function attackVariance(rng: () => number = Math.random): number {
  return 0.85 + rng() * 0.3;
}

export interface FleeChanceInput {
  playerSpeed: number;
  enemySpeed: number;
  fleeAttempts: number;
  unlockedSkills: readonly string[];
  karma: number;
}

/** Cumulative flee chance with skill/karma modifiers, clamped to [0.15, 0.95]. */
export function computeFleeChance(input: FleeChanceInput): number {
  let fleeChance = 0.35 + (input.playerSpeed - input.enemySpeed) * 0.04;
  fleeChance += input.fleeAttempts * 0.15;
  if (input.unlockedSkills.includes('tech_4a')) fleeChance += 0.2;
  if (input.unlockedSkills.includes('social_2a')) fleeChance += 0.15;
  if (input.karma >= 70) fleeChance += 0.05;
  return Math.max(0.15, Math.min(0.95, fleeChance));
}

/** XP/karma combo bonus on victory — capped at +10. */
export function computeVictoryComboBonus(maxCombo: number): number {
  return Math.min(maxCombo * 2, 10);
}

/** Loot roll chance on victory — capped at 90%. */
export function computeVictoryLootChance(maxCombo: number): number {
  return Math.min(0.9, 0.6 + maxCombo * 0.05);
}

/** Skill XP split from combat XP reward. */
export function buildVictorySkillXp(
  xpGained: number,
): Partial<Record<TrainablePlayerSkill, number>> {
  return {
    coding: Math.floor(xpGained * 0.3),
    logic: Math.floor(xpGained * 0.2),
    writing: Math.floor(xpGained * 0.1),
  };
}

/** Defeat energy/karma penalties (same ranges as prior CombatSystem). */
export function computeDefeatPenalties(rng: () => number = Math.random): {
  energyLost: number;
  karmaLost: number;
} {
  return {
    energyLost: 15 + Math.floor(rng() * 10),
    karmaLost: 5 + Math.floor(rng() * 5),
  };
}

/** Spiritual skill tree damage reduction factor (5% per unlocked spiritual_*). */
export function spiritualDamageReduction(unlockedSkills: readonly string[]): number {
  const spiritualLevel = unlockedSkills.filter((id) => id.startsWith('spiritual_')).length;
  return spiritualLevel > 0 ? spiritualLevel * 0.05 : 0;
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

export const calculateXpToNextLevel = storeCalculateXpToNextLevel;

export function addXp(amount: number): void {
  dispatchGameAction({ type: 'player/addXp', amount });
}
