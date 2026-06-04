/* ─── Combat System — Buff / Debuff Duration Management ─── */

import type { CombatState, CombatLogEntry, CombatBuff, BuffEffect } from './types';

/** Create a buff/debuff with a unique id */
export function createBuff(
  state: CombatState,
  name: string,
  source: string,
  kind: 'buff' | 'debuff',
  target: 'player' | 'enemy',
  duration: number,
  effect: BuffEffect,
): CombatBuff {
  const id = `${source}_${state._nextBuffId}`;
  return { id, name, source, kind, target, duration, effect };
}

/** Add a buff to combat state with stack limit and mutual exclusion rules.
 *  Max 2 active buffs per target. defense_reduction and damage_multiplier
 *  on the same target are mutually exclusive (the weaker one is removed). */
export function addBuff(state: CombatState, buff: CombatBuff): CombatState {
  let filtered = state.buffs.filter((b) => b.source !== buff.source || b.target !== buff.target || b.effect.type !== buff.effect.type);

  // Mutual exclusion: defense_reduction and damage_multiplier are incompatible on the same target
  const MUTUALLY_EXCLUSIVE: Record<BuffEffect['type'], BuffEffect['type'][]> = {
    defense_reduction: ['damage_multiplier'],
    damage_multiplier: ['defense_reduction'],
    skip_turn: [],
    stat_drain: [],
    defense_boost: [],
    damage_reduction: [],
    attack_boost: [],
    hp_drain_percent: [],
    silence_specials: [],
    defensive_verse: [],
  };
  const excluded = MUTUALLY_EXCLUSIVE[buff.effect.type] ?? [];
  for (const excludedType of excluded) {
    filtered = filtered.filter((b) => !(b.target === buff.target && b.effect.type === excludedType));
  }

  // Stack limit: max 2 buffs per target (excluding the one being refreshed)
  const existingForTarget = filtered.filter((b) => b.target === buff.target);
  if (existingForTarget.length >= 2) {
    // Remove the oldest buff for this target to make room
    const oldestId = existingForTarget[0].id;
    filtered = filtered.filter((b) => b.id !== oldestId);
  }

  return { ...state, buffs: [...filtered, buff], _nextBuffId: state._nextBuffId + 1 };
}

/** Calculate total buff effect of a given type for a target */
export function sumBuffEffect(state: CombatState, target: 'player' | 'enemy', effectType: BuffEffect['type']): number {
  return state.buffs
    .filter((b) => b.target === target && b.effect.type === effectType)
    .reduce((sum, b) => {
      if ('value' in b.effect) return sum + (b.effect as { type: string; value: number }).value;
      return sum;
    }, 0);
}

/** Check if target has a specific buff effect type */
export function hasBuffEffect(state: CombatState, target: 'player' | 'enemy', effectType: BuffEffect['type']): boolean {
  return state.buffs.some((b) => b.target === target && b.effect.type === effectType);
}

/** Process buff durations at start of a target's turn. Returns updated state + log entries */
export function tickBuffs(state: CombatState, target: 'player' | 'enemy'): { state: CombatState; expiredLog: CombatLogEntry[] } {
  const expiredLog: CombatLogEntry[] = [];
  const remaining: CombatBuff[] = [];

  for (const buff of state.buffs) {
    if (buff.target !== target) {
      // Not this target's buff — keep unchanged
      remaining.push(buff);
      continue;
    }

    const newDuration = buff.duration - 1;
    if (newDuration <= 0) {
      expiredLog.push({
        turn: state.turn,
        text: `⏳ ${buff.name} рассеивается.`,
        type: 'buff_expire',
      });
    } else {
      remaining.push({ ...buff, duration: newDuration });
    }
  }

  return {
    state: { ...state, buffs: remaining },
    expiredLog,
  };
}

/* ═══════════════════════════════════════════════════════════════
   Derived Buff Calculations
   ═══════════════════════════════════════════════════════════════ */

/** Get total enemy defense reduction from buffs (0–1) */
export function getEnemyDefenseReduction(state: CombatState): number {
  return Math.min(1, sumBuffEffect(state, 'enemy', 'defense_reduction') + state.enemyDefenseReduction);
}

/** Get player damage multiplier from buffs */
export function getPlayerDamageMultiplier(state: CombatState): number {
  const fromBuffs = sumBuffEffect(state, 'player', 'damage_multiplier');
  return state.doubleAttack ? Math.max(fromBuffs, 1.5) : Math.max(fromBuffs, 1);
}

/** Get player damage reduction from buffs (0–1). Includes defensive_verse (30% flat). */
export function getPlayerDamageReduction(state: CombatState): number {
  const fromBuffs = sumBuffEffect(state, 'player', 'damage_reduction');
  const hasDefensiveVerse = hasBuffEffect(state, 'player', 'defensive_verse');
  const verseReduction = hasDefensiveVerse ? 0.3 : 0;
  return Math.min(0.8, Math.max(0, fromBuffs + verseReduction));
}

/** Get player vulnerability from defense_reduction debuffs (0–1).
 *  When an enemy applies defense_reduction to the player, it means the player
 *  takes MORE damage — this function returns the additional damage fraction. */
export function getPlayerVulnerability(state: CombatState): number {
  const fromDebuffs = sumBuffEffect(state, 'player', 'defense_reduction');
  return Math.min(0.6, Math.max(0, fromDebuffs));
}

/** Get enemy damage multiplier from buffs */
export function getEnemyDamageMultiplier(state: CombatState): number {
  return Math.max(1, sumBuffEffect(state, 'enemy', 'damage_multiplier'));
}

/** Get enemy attack boost from buffs (flat bonus) */
export function getEnemyAttackBoost(state: CombatState): number {
  return sumBuffEffect(state, 'enemy', 'attack_boost');
}

/** Get player attack boost from buffs (flat bonus) */
export function getPlayerAttackBoost(state: CombatState): number {
  return sumBuffEffect(state, 'player', 'attack_boost');
}

/** Get player defense boost from buffs (flat bonus) */
export function getPlayerDefenseBoost(state: CombatState): number {
  return sumBuffEffect(state, 'player', 'defense_boost');
}
