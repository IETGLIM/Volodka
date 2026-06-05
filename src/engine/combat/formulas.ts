/* ─── Combat System — Formulas: damage, defense, flee, player stats ─── */

import type { CombatState } from './types';
import { getGameStore } from '@/store/gameStore';
import { calculateXpToNextLevel as storeCalculateXpToNextLevel } from '@/store/shared';

/* ─── Player Stats from Game Store ─── */

export function getPlayerAttack(): number {
  const store = getGameStore();
  return store.playerState.skills.coding + store.playerState.skills.logic;
}

export function getPlayerDefense(): number {
  const store = getGameStore();
  return store.playerState.skills.empathy + Math.floor(store.playerState.energy / 10);
}

export function getPlayerMaxHp(): number {
  const store = getGameStore();
  return store.playerState.energy * 2;
}

/* ─── Poem Power Cooldown Helpers ─── */

/** Tick all power cooldowns by 1. Returns updated cooldowns map (expired entries removed). */
export function tickPowerCooldowns(cooldowns: Record<string, number>): Record<string, number> {
  const updated: Record<string, number> = {};
  for (const [id, cd] of Object.entries(cooldowns)) {
    const remaining = cd - 1;
    if (remaining > 0) updated[id] = remaining;
  }
  return updated;
}

/** Check if a poem power is available (collected + cooldown = 0) */
export function isPowerAvailable(poemId: string, state: CombatState): boolean {
  const store = getGameStore();
  if (!store.collectedPoems.includes(poemId)) return false;
  if ((state.powerCooldowns[poemId] ?? 0) > 0) return false;
  return true;
}

/* ─── XP / Leveling ─── */

export const calculateXpToNextLevel = storeCalculateXpToNextLevel;

export function addXp(amount: number): void {
  const store = getGameStore();
  store.addXp(amount);
}
