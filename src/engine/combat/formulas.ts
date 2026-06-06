/* ─── Combat System — Formulas: damage, defense, flee, player stats ─── */

import type { CombatState } from './types';
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
