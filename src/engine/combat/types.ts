/* ─── Combat System — Types & Constants ─── */

// Re-export all combat-related types so existing imports don't break
export type {
  EnemyType,
  CombatEnemy,
  CombatState,
  CombatLogEntry,
  CombatAction,
  CombatBuff,
  BuffEffect,
  EnemySpecialAttack,
  SideEffect,
  CombatReward } from '@/shared/types/game';

import type {
  EnemyType,
  CombatState,
  CombatLogEntry,
  EnemySpecialAttack } from '@/shared/types/game';

/** Template for defining enemy stats and special attacks */
export interface EnemyTemplate {
  type: EnemyType;
  name: string;
  emoji: string;
  /** Short flavour description shown in encounter presentation */
  description: string;
  baseHp: number;
  baseAttack: number;
  baseDefense: number;
  baseSpeed: number;
  targetsStat: 'logic' | 'energy' | 'karma' | 'empathy';
  lootTable: string[];
  xpReward: number;
  specialAttacks: EnemySpecialAttack[];
  /** In-combat bark lines — one is chosen at random when the enemy attacks */
  attackBarks: string[];
  /** Lines shown when the enemy is defeated */
  defeatBarks: string[];
}

/** Poem combat ability definition with cooldown */
export interface PoemCombatAbility {
  poemId: string;
  name: string;
  description: string;
  /** Cooldown in turns before this ability can be reused */
  cooldown: number;
  /** Execute the poem ability, returning updated state.
   *  May include _sideEffects for deferred store mutations (P0-2.6). */
  execute: (state: CombatState) => CombatState;
}

/** Maximum combat log entries — prevents unbounded memory growth */
export const MAX_COMBAT_LOG = 50;

/** Append entries to combat log, trimming oldest if over the limit */
export function appendLog(current: CombatLogEntry[], ...entries: CombatLogEntry[]): CombatLogEntry[] {
  const combined = [...current, ...entries];
  return combined.length > MAX_COMBAT_LOG ? combined.slice(-MAX_COMBAT_LOG) : combined;
}
