/**
 * Perk effect modifiers — pure resolvers.
 *
 * The store-side {@link PlayerProgressionSlice.getActivePerkEffects} collects
 * raw PerkEffect[] from unlockedPerks, but it is bound to a store instance and
 * therefore cannot be called from pure combat formulas, movement math, or
 * passive-skill helpers. This module bridges that gap: every resolver takes
 * `unlockedPerks` (and optional context) and returns aggregated numeric
 * modifiers that consumers apply directly.
 *
 * Previously only `skill_bonus` perks were applied (in acquirePerk). All other
 * effect types — `combat_bonus`, `energy_max`, `stress_resist`, `karma_gain`,
 * `poem_power`, `movement`, `credits_mult` — were silently dropped. This file
 * wires them up.
 *
 * Semantics reference (see data/perks.ts for canonical descriptions):
 *
 * combat_bonus:
 *   - value >= 1, integer  → flat attack or flat defense (perk-id mapped)
 *   - 0 < value < 1        → damage multiplier (conditional on stress/time/combo)
 *   - value < 0            → incoming damage reduction fraction
 *   - specific perk ids    → counter-attack chance, flee chance
 *
 * energy_max:
 *   - value >= 1           → flat bonus to max energy
 *   - 0 < value < 1        → energy regen / coffee-effect multiplier
 *
 * stress_resist: 0..1 fraction of incoming stress to absorb
 * karma_gain:    0..N multiplier bonus on positive karma gains
 * poem_power:    0..N multiplier on poem TTL duration; whisper_of_muses reduces cooldown
 * movement:      0..N multiplier on movement speed (conditional on time)
 * credits_mult:  0..N multiplier on credit gains
 */

import { PERKS_MAP, type PerkEffect } from '@/data/perks';

/* ─── Internal: collect effects by type ─── */

function collectEffects(unlockedPerks: readonly string[], type: PerkEffect['type']): PerkEffect[] {
  const out: PerkEffect[] = [];
  for (const perkId of unlockedPerks) {
    const def = PERKS_MAP[perkId];
    if (!def) continue;
    for (const eff of def.effects) {
      if (eff.type === type) out.push(eff);
    }
  }
  return out;
}

/* ─── Context types ─── */

export interface CombatPerkContext {
  /** Current player stress (0–100). */
  stress?: number;
  /** In-game hour 0–24, used for night_owl / night_watch / night_coder. */
  timeOfDay?: number;
  /** Current combo count (0, 1, 2, 3+). */
  comboCount?: number;
}

export interface MovementPerkContext {
  /** In-game hour 0–24. */
  timeOfDay?: number;
}

export interface EnergyPerkContext {
  /** In-game hour 0–24. */
  timeOfDay?: number;
}

/* ─── Perk-id sets for disambiguation ─── */

// combat_bonus with integer value >= 1 — flat attack.
const FLAT_ATTACK_PERKS = new Set<string>(['code_rage']);
// combat_bonus with integer value >= 1 — flat defense.
const FLAT_DEFENSE_PERKS = new Set<string>(['combat_meditation']);
// combat_bonus with negative value — incoming damage reduction fraction.
const DAMAGE_REDUCTION_PERKS = new Set<string>(['fortitude']);
// combat_bonus with 0 < value < 1 — chance of counter-attack after defend.
const COUNTER_CHANCE_PERKS = new Set<string>(['counterattack']);
// combat_bonus with 0 < value < 1 — chance to avoid random encounter.
const FLEE_CHANCE_PERKS = new Set<string>(['shadow_walker']);
// combat_bonus with 0 < value < 1 — generic outgoing damage multiplier
// (combat_veteran always, stress_mastery when stress > 50, night_owl at night,
// code_poet when combo >= 3).
const DAMAGE_MULT_PERKS = new Set<string>([
  'combat_veteran',
  'stress_mastery',
  'night_owl',
  'code_poet',
]);
// combat_bonus with 0 < value < 1 — defense multiplier (combat_veteran second effect).
const DEFENSE_MULT_PERKS = new Set<string>(['combat_veteran']);

// poem_power with 0 < value < 1 — TTL duration multiplier.
const POEM_DURATION_PERKS = new Set<string>([
  'voice_of_elements',
  'warrior_poet',
  'poetic_soul',
  'poem_mastery',
]);
// poem_power with 0 < value < 1 — cooldown reduction fraction (whisper_of_muses).
const POEM_COOLDOWN_PERKS = new Set<string>(['whisper_of_muses']);

// energy_max with value >= 1 — flat max energy bonus (night_watch at night, factory_rat always).
const ENERGY_MAX_FLAT_PERKS = new Set<string>(['night_watch', 'factory_rat']);
// energy_max with 0 < value < 1 — regen / coffee effect multiplier.
const ENERGY_REGEN_PERKS = new Set<string>(['coffee_master', 'fast_metabolism']);

// movement with 0 < value < 1 — speed multiplier, conditional on time.
const MOVEMENT_SPEED_PERKS = new Set<string>([
  'cyber_reflexes', // always
  'night_owl', // at night
  'shadow_walker', // at night (mutually exclusive with night_owl)
  'invisible', // detection reduction (modelled as speed bonus for sneak)
]);

/* ─── Helpers ─── */

function isNight(timeOfDay: number | undefined): boolean {
  if (timeOfDay === undefined) return false;
  // Night: 22:00–05:00.
  return timeOfDay >= 22 || timeOfDay < 5;
}

/* ─── Combat resolvers ─── */

export interface CombatPerkModifiers {
  /** Flat bonus added to player attack (coding + logic). */
  flatAttackBonus: number;
  /** Flat bonus added to player defense (empathy + energy/10). */
  flatDefenseBonus: number;
  /** Outgoing damage multiplier (1 = no change, 1.15 = +15%). Stacks multiplicatively. */
  outgoingDamageMultiplier: number;
  /** Incoming damage reduction fraction (0 = none, 0.2 = -20%). Capped at 0.8. */
  incomingDamageReduction: number;
  /** Counter-attack chance after defend (0..1). */
  counterAttackChance: number;
  /** Chance to avoid a random encounter (0..1). */
  fleeEncounterChance: number;
  /** Defense multiplier (1 = no change, 1.1 = +10%). */
  defenseMultiplier: number;
}

const EMPTY_COMBAT: CombatPerkModifiers = {
  flatAttackBonus: 0,
  flatDefenseBonus: 0,
  outgoingDamageMultiplier: 1,
  incomingDamageReduction: 0,
  counterAttackChance: 0,
  fleeEncounterChance: 0,
  defenseMultiplier: 1,
};

export function resolveCombatPerkModifiers(
  unlockedPerks: readonly string[],
  ctx: CombatPerkContext = {},
): CombatPerkModifiers {
  if (unlockedPerks.length === 0) return EMPTY_COMBAT;

  const mods: CombatPerkModifiers = { ...EMPTY_COMBAT };
  const stress = ctx.stress ?? 0;
  const isNightTime = isNight(ctx.timeOfDay);
  const combo = ctx.comboCount ?? 0;

  for (const perkId of unlockedPerks) {
    const def = PERKS_MAP[perkId];
    if (!def) continue;

    for (const eff of def.effects) {
      if (eff.type !== 'combat_bonus') continue;
      const v = eff.value;

      if (FLAT_ATTACK_PERKS.has(perkId)) {
        // code_rage: +4 attack when stress > 60.
        if (stress > 60) mods.flatAttackBonus += v;
      } else if (FLAT_DEFENSE_PERKS.has(perkId)) {
        // combat_meditation: +3 defense when stress < 30.
        if (stress < 30) mods.flatDefenseBonus += v;
      } else if (DAMAGE_REDUCTION_PERKS.has(perkId)) {
        // fortitude: -20% incoming damage.
        mods.incomingDamageReduction += Math.abs(v);
      } else if (COUNTER_CHANCE_PERKS.has(perkId)) {
        // counterattack: 25% chance.
        mods.counterAttackChance += v;
      } else if (FLEE_CHANCE_PERKS.has(perkId)) {
        // shadow_walker: 10% chance to avoid battle.
        mods.fleeEncounterChance += v;
      } else if (DEFENSE_MULT_PERKS.has(perkId) && v > 0 && v < 1) {
        // combat_veteran has two combat_bonus effects: +15% damage and +10% defense.
        // Distinguish by description keyword so we apply each to the right stat.
        if (eff.description.toLowerCase().includes('защит')) {
          mods.defenseMultiplier *= 1 + v;
        } else {
          mods.outgoingDamageMultiplier *= 1 + v;
        }
      } else if (DAMAGE_MULT_PERKS.has(perkId)) {
        // Conditional damage multipliers.
        let applies = false;
        if (perkId === 'combat_veteran') applies = true;
        else if (perkId === 'stress_mastery') applies = stress > 50;
        else if (perkId === 'night_owl') applies = isNightTime;
        else if (perkId === 'code_poet') applies = combo >= 3;
        if (applies) mods.outgoingDamageMultiplier *= 1 + v;
      }
    }
  }

  // Cap reductions to prevent invulnerability.
  mods.incomingDamageReduction = Math.min(0.8, mods.incomingDamageReduction);
  // Cap chances at 1.
  mods.counterAttackChance = Math.min(1, mods.counterAttackChance);
  mods.fleeEncounterChance = Math.min(1, mods.fleeEncounterChance);

  return mods;
}

/* ─── Karma resolver ─── */

/**
 * Multiplier for positive karma gains. karma_gain perks (authority +15%,
 * poetic_soul +10%, poem_mastery +20%, guild_diplomat +15%) stack
 * additively then apply as a single multiplier.
 *
 * Negative karma changes are NOT amplified — players shouldn't be punished
 * harder for taking the dark path just because they picked poetic_soul.
 */
export function resolveKarmaGainMultiplier(unlockedPerks: readonly string[]): number {
  if (unlockedPerks.length === 0) return 1;
  let bonus = 0;
  for (const eff of collectEffects(unlockedPerks, 'karma_gain')) {
    bonus += eff.value;
  }
  return 1 + bonus;
}

/* ─── Stress resolver ─── */

/**
 * Fraction of incoming stress to absorb (0..0.8). stress_resist perks
 * (stress_resistance 0.2, iron_stomach 0.25, iron_will 0.15, stress_mastery 0.3)
 * stack additively, capped at 0.8 so the player can never become fully immune.
 *
 * Only positive stress is reduced — negative stress (relief) passes through.
 */
export function resolveStressResistFraction(unlockedPerks: readonly string[]): number {
  if (unlockedPerks.length === 0) return 0;
  let fraction = 0;
  for (const eff of collectEffects(unlockedPerks, 'stress_resist')) {
    fraction += eff.value;
  }
  return Math.min(0.8, Math.max(0, fraction));
}

/* ─── Energy resolvers ─── */

/**
 * Flat bonus to max energy. night_watch (+10, at night) and factory_rat (+15,
 * always). The clamp in addEnergy uses 100 by default — consumers should add
 * this bonus to the clamp ceiling.
 */
export function resolveEnergyMaxFlatBonus(
  unlockedPerks: readonly string[],
  ctx: EnergyPerkContext = {},
): number {
  if (unlockedPerks.length === 0) return 0;
  let bonus = 0;
  const isNightTime = isNight(ctx.timeOfDay);
  for (const perkId of unlockedPerks) {
    if (!ENERGY_MAX_FLAT_PERKS.has(perkId)) continue;
    const def = PERKS_MAP[perkId];
    if (!def) continue;
    for (const eff of def.effects) {
      if (eff.type !== 'energy_max') continue;
      if (eff.value < 1) continue; // multipliers handled separately
      if (perkId === 'night_watch' && !isNightTime) continue;
      bonus += eff.value;
    }
  }
  return bonus;
}

/**
 * Multiplier for energy regen and coffee-effect magnitude (1 = no change,
 * 1.5 = +50%). coffee_master and fast_metabolism each add +0.5.
 */
export function resolveEnergyRegenMultiplier(unlockedPerks: readonly string[]): number {
  if (unlockedPerks.length === 0) return 1;
  let mult = 1;
  for (const perkId of unlockedPerks) {
    if (!ENERGY_REGEN_PERKS.has(perkId)) continue;
    const def = PERKS_MAP[perkId];
    if (!def) continue;
    for (const eff of def.effects) {
      if (eff.type !== 'energy_max') continue;
      if (eff.value >= 1) continue;
      mult += eff.value;
    }
  }
  return mult;
}

/* ─── Movement resolver ─── */

/**
 * Multiplier on movement speed (1 = no change, 1.2 = +20%). cyber_reflexes
 * always, night_owl / shadow_walker at night, invisible as a subtle bonus.
 * Stacks multiplicatively.
 */
export function resolveMovementSpeedMultiplier(
  unlockedPerks: readonly string[],
  ctx: MovementPerkContext = {},
): number {
  if (unlockedPerks.length === 0) return 1;
  let mult = 1;
  const isNightTime = isNight(ctx.timeOfDay);
  for (const perkId of unlockedPerks) {
    if (!MOVEMENT_SPEED_PERKS.has(perkId)) continue;
    const def = PERKS_MAP[perkId];
    if (!def) continue;
    for (const eff of def.effects) {
      if (eff.type !== 'movement') continue;
      let applies = false;
      if (perkId === 'cyber_reflexes') applies = true;
      else if (perkId === 'night_owl') applies = isNightTime;
      else if (perkId === 'shadow_walker') applies = isNightTime;
      else if (perkId === 'invisible') applies = true; // detection reduction
      if (applies) mult *= 1 + eff.value;
    }
  }
  return mult;
}

/* ─── Poem power resolvers ─── */

/**
 * Multiplier on poem power TTL duration (1 = no change, 1.5 = +50%).
 * voice_of_elements, warrior_poet, poetic_soul, poem_mastery stack
 * multiplicatively.
 */
export function resolvePoemPowerDurationMultiplier(unlockedPerks: readonly string[]): number {
  if (unlockedPerks.length === 0) return 1;
  let mult = 1;
  for (const perkId of unlockedPerks) {
    if (!POEM_DURATION_PERKS.has(perkId)) continue;
    const def = PERKS_MAP[perkId];
    if (!def) continue;
    for (const eff of def.effects) {
      if (eff.type !== 'poem_power') continue;
      // whisper_of_muses uses poem_power for cooldown reduction, skip here.
      if (POEM_COOLDOWN_PERKS.has(perkId)) continue;
      mult *= 1 + eff.value;
    }
  }
  return mult;
}

/**
 * Fraction by which to reduce poem power cooldowns (0 = no reduction,
 * 0.25 = -25%). whisper_of_muses is the only perk in this category.
 */
export function resolvePoemPowerCooldownReduction(unlockedPerks: readonly string[]): number {
  if (unlockedPerks.length === 0) return 0;
  let reduction = 0;
  for (const perkId of unlockedPerks) {
    if (!POEM_COOLDOWN_PERKS.has(perkId)) continue;
    const def = PERKS_MAP[perkId];
    if (!def) continue;
    for (const eff of def.effects) {
      if (eff.type !== 'poem_power') continue;
      reduction += eff.value;
    }
  }
  return Math.min(0.75, Math.max(0, reduction));
}

/* ─── Credits resolver ─── */

/**
 * Multiplier on credit gains from loot, sales, and quest rewards
 * (1 = no change, 1.2 = +20%). scavenger (+20% loot credits),
 * guild_diplomat (+30% sale credits), friend_of_all (+50% — description says
 * relations but effect type is credits_mult; we apply to credits to match the
 * declared effect type, and a separate relation bonus is applied elsewhere).
 */
export function resolveCreditsMultiplier(unlockedPerks: readonly string[]): number {
  if (unlockedPerks.length === 0) return 1;
  let mult = 1;
  for (const eff of collectEffects(unlockedPerks, 'credits_mult')) {
    mult += eff.value;
  }
  return mult;
}

/**
 * Multiplier on NPC relation gains (1 = no change, 1.5 = +50%).
 * friend_of_all declares credits_mult +0.5 but its description says
 * "+50% прирост отношений" — we honour the description here so the perk
 * actually does what the player reads.
 */
export function resolveNpcRelationGainMultiplier(unlockedPerks: readonly string[]): number {
  if (unlockedPerks.length === 0) return 1;
  let mult = 1;
  if (unlockedPerks.includes('friend_of_all')) mult += 0.5;
  // guild_diplomat description: "+15% к отношениям с NPC".
  if (unlockedPerks.includes('guild_diplomat')) mult += 0.15;
  return mult;
}
