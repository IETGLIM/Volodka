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

/** Identity key for refreshable buffs — same source + target + effect type replaces instead of stacking. */
function buffStackKey(buff: CombatBuff): string {
  return `${buff.target}:${buff.source}:${buff.effect.type}`;
}

/** Higher value = harder to evict when buff slots are full. */
export function getBuffEvictionPriority(buff: CombatBuff): number {
  const effectPriority: Record<BuffEffect['type'], number> = {
    skip_turn: 90,
    silence_specials: 85,
    defensive_verse: 80,
    damage_reduction: 75,
    defense_boost: 70,
    damage_multiplier: 65,
    attack_boost: 60,
    defense_reduction: 55,
    stat_drain: 50,
    hp_drain_percent: 45,
  };
  const base = effectPriority[buff.effect.type] ?? 40;
  const kindBonus = buff.kind === 'debuff' && buff.target === 'player' ? 5 : 0;
  return base + kindBonus;
}

function pickBuffToEvict(candidates: CombatBuff[]): CombatBuff {
  return candidates.reduce((lowest, current) => {
    const currentPriority = getBuffEvictionPriority(current);
    const lowestPriority = getBuffEvictionPriority(lowest);
    if (currentPriority < lowestPriority) return current;
    if (currentPriority > lowestPriority) return lowest;
    return current;
  });
}

/** Add a buff to combat state with stack limit and mutual exclusion rules.
 *  Re-applying the same buff (e.g. spam Defend) refreshes duration instead of stacking.
 *  Max 2 active buffs and 2 active debuffs per target (counted separately).
 *  on the same target are mutually exclusive (the weaker one is removed). */
export function addBuff(state: CombatState, buff: CombatBuff): CombatState {
  const key = buffStackKey(buff);
  const existing = state.buffs.find((b) => buffStackKey(b) === key);
  let filtered = state.buffs.filter((b) => buffStackKey(b) !== key);
  const buffToAdd: CombatBuff = existing
    ? { ...buff, duration: Math.max(existing.duration, buff.duration) }
    : buff;

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

  // Stack limit: max 2 effects per target and kind (buff/debuff tracked separately)
  const existingForTarget = filtered.filter(
    (b) => b.target === buff.target && b.kind === buff.kind,
  );
  if (existingForTarget.length >= 2) {
    const toEvict = pickBuffToEvict(existingForTarget);
    filtered = filtered.filter((b) => b.id !== toEvict.id);
  }

  return { ...state, buffs: [...filtered, buffToAdd], _nextBuffId: state._nextBuffId + 1 };
}

/** Calculate total buff effect of a given type for a target */
export function sumBuffEffect(state: CombatState, target: 'player' | 'enemy', effectType: BuffEffect['type']): number {
  return state.buffs
    .filter((b) => b.target === target && b.effect.type === effectType)
    .reduce((sum, b) => {
      const eff = b.effect;
      if ('value' in eff) return sum + eff.value;
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

/** Get total enemy defense reduction from buffs (0–1).
 *  `enemyDefenseReduction` on CombatState is a UI mirror only — do not add it here
 *  or buff + legacy field double-count (e.g. poem_1 after playerAttack sync). */
export function getEnemyDefenseReduction(state: CombatState): number {
  return Math.min(1, sumBuffEffect(state, 'enemy', 'defense_reduction'));
}

/** Get player damage multiplier from buffs.
 *  NOTE: The legacy `doubleAttack` field on CombatState is no longer read here.
 *  Poem_6 (Слово Мощь) now uses the buff system exclusively with a
 *  `damage_multiplier` buff value of 1.5. The old backward-compat code
 *  caused double-counting (buff 1.5× + legacy 1.5× = ~2.25× instead of 1.5×). */
export function getPlayerDamageMultiplier(state: CombatState): number {
  const fromBuffs = sumBuffEffect(state, 'player', 'damage_multiplier');
  return Math.max(fromBuffs, 0.1);
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
