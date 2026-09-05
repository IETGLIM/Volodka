/* ─── Combat System — Victory / Defeat Rewards (pure functions) ───
 *
 * Extracted from CombatSystem.ts (§9 / §3.1.2) to isolate the reward
 * computation from combat singleton side effects. All functions here
 * are **pure** — they take combat state (and a small input object) and
 * return rolled numbers + an updated RNG state. The orchestrator
 * (CombatSystem.ts) is responsible for dispatching the returned
 * actions (player/addKarma, /addXp, /addCredits, /setFlag), trying to
 * add loot to the inventory, building the final CombatReward object,
 * assembling the victory/defeat log line, calling combat.setState,
 * emitting events, and scheduling the post-combat exit.
 *
 * Why pure: enables unit-testing all combo/enemy-type/loot-table branches
 * without instantiating the combat singleton or mocking the game store.
 */

import type {
  CombatState,
  CombatReward,
  CombatLogEntry,
} from './types';
import { isBossEnemyType } from './types';
import type { TrainablePlayerSkill } from '@/shared/types/definitions/skills';
import { SeededCombatRng } from './combatRng';
import type { CombatRngState } from './combatRng';
import { computeCombatCredits } from './formulas';

/* ═══════════════════════════════════════════════════════════════
   §9.1 — Victory Rewards
   ═══════════════════════════════════════════════════════════════ */

/** Input for `computeVictoryRewards`. */
export interface ComputeVictoryRewardsInput {
  /** Current combat state — RNG is read from `state.rng` and advanced. */
  combatState: CombatState;
  /** Difficulty credits multiplier (orchestrator passes
   *  `snap().difficultySettings.creditsMultiplier`). */
  creditsMultiplier: number;
  /** Pre-resolved defeat barks (orchestrator passes
   *  `ENEMY_TEMPLATES[enemy.type]?.defeatBarks ?? []`). The pure
   *  function does not depend on ENEMY_TEMPLATES directly. */
  defeatBarks: readonly string[];
}

/** Result of `computeVictoryRewards`. The orchestrator uses the rolled
 *  numbers to dispatch game actions, then constructs the final
 *  `CombatReward` after the loot-add attempt. */
export interface ComputedVictoryRewards {
  /** Karma gained (orchestrator dispatches `player/addKarma`). */
  karmaGained: number;
  /** XP gained (orchestrator calls `addXp`). */
  xpGained: number;
  /** Credits gained (orchestrator dispatches `player/addCredits`). */
  creditsGained: number;
  /** Loot item ID rolled, or null if no drop. Orchestrator calls
   *  `tryAddInventoryItem(createInventoryItem(lootDrop))` if non-null;
   *  the loot only counts toward the final reward if the add succeeds. */
  lootDrop: string | null;
  /** Skill XP partial map (coding 30%, logic 20%, writing 10% of xpGained). */
  skillXp: Partial<Record<TrainablePlayerSkill, number>>;
  /** RNG state after all rolls (karma roll, loot chance roll, loot index
   *  roll, defeat bark index roll). Orchestrator stores this in
   *  `combatState.rng` of the next state. */
  rng: CombatRngState;
  /** Enemy defeat bark (dramatic last words) for the victory log entry,
   *  or null if the enemy template has no defeat barks. */
  defeatBark: string | null;
  /** Combo bonus used in the karma/xp/credits calculation
   *  (`min(maxCombo * 2, 10)`). Exposed for the orchestrator's log line. */
  comboBonus: number;
  /** Whether the enemy is a boss (orchestrator dispatches
   *  `player/setFlag` with `${enemy.type}_defeated` if true). */
  isBoss: boolean;
}

/**
 * Compute the victory rewards for a combat state.
 *
 * Pure: rolls the karma bonus, loot drop, and defeat bark; computes
 * XP / credits / skill XP; returns everything the orchestrator needs
 * to apply side effects and assemble the final CombatReward + log line.
 *
 * Combo bonus caps at +10 (maxCombo * 2). Karma = 3 + 0..4 + comboBonus.
 * XP = enemy.xpReward + comboBonus. Credits = max(1, floor(
 * computeCombatCredits(xpGained, comboBonus) * creditsMultiplier)).
 * Loot chance = min(0.9, 0.6 + maxCombo * 0.05) — higher combo = better
 * loot chance. Skill XP: coding 30%, logic 20%, writing 10% of xpGained.
 */
export function computeVictoryRewards(
  input: ComputeVictoryRewardsInput,
): ComputedVictoryRewards {
  const { combatState: cs, creditsMultiplier, defeatBarks } = input;
  const enemy = cs.enemy;
  const victoryRng = SeededCombatRng.fromState(cs.rng);

  const comboBonus = Math.min(cs.maxCombo * 2, 10);
  const karmaGained = 3 + victoryRng.nextInt(0, 4) + comboBonus;
  const xpGained = enemy.xpReward + comboBonus;
  const creditsGained = Math.max(
    1,
    Math.floor(computeCombatCredits(xpGained, comboBonus) * creditsMultiplier),
  );

  // Loot roll (higher combo = better loot chance, capped at 0.9)
  const lootChance = 0.6 + cs.maxCombo * 0.05;
  let lootDrop: string | null = null;
  if (enemy.lootTable.length > 0 && victoryRng.roll(Math.min(0.9, lootChance))) {
    lootDrop = enemy.lootTable[victoryRng.nextInt(0, enemy.lootTable.length - 1)];
  }

  // Skill experience distribution
  const skillXp: Partial<Record<TrainablePlayerSkill, number>> = {};
  skillXp.coding = Math.floor(xpGained * 0.3);
  skillXp.logic = Math.floor(xpGained * 0.2);
  skillXp.writing = Math.floor(xpGained * 0.1);

  // Enemy defeat bark — dramatic last words (if defined)
  const defeatBark =
    defeatBarks.length > 0
      ? defeatBarks[victoryRng.nextInt(0, defeatBarks.length - 1)]
      : null;

  return {
    karmaGained,
    xpGained,
    creditsGained,
    lootDrop,
    skillXp,
    rng: victoryRng.getState(),
    defeatBark,
    comboBonus,
    isBoss: isBossEnemyType(enemy.type),
  };
}

/**
 * Build the final `CombatReward` object after the loot-add attempt.
 *
 * Pure helper — the orchestrator calls this with the loot item IDs that
 * were successfully added to inventory.
 */
export function buildCombatReward(
  computed: ComputedVictoryRewards,
  lootItems: readonly string[],
): CombatReward {
  return {
    xp: computed.xpGained,
    karma: computed.karmaGained,
    credits: computed.creditsGained,
    lootItems: [...lootItems],
    skillXp: { ...computed.skillXp },
  };
}

/**
 * Build the victory log entries (defeat bark + summary line).
 *
 * Pure helper — the orchestrator appends these to the existing combat log.
 *
 * Matches the original log format exactly:
 *  `💀 <defeatBark>` (only if a bark exists)
 *  `🏆 Победа! +X кармы, +Y опыта, +Z кредитов[, найден предмет!][ Макс. комбо: xN!]`
 */
export function buildVictoryLogEntries(
  turn: number,
  computed: ComputedVictoryRewards,
  lootItemsCount: number,
  maxCombo: number,
): CombatLogEntry[] {
  const entries: CombatLogEntry[] = [];
  if (computed.defeatBark) {
    entries.push({
      turn,
      text: `💀 ${computed.defeatBark}`,
      type: 'defeat',
    });
  }
  entries.push({
    turn,
    text:
      `🏆 Победа! +${computed.karmaGained} кармы, +${computed.xpGained} опыта, +${computed.creditsGained} кредитов` +
      `${lootItemsCount > 0 ? `, найден предмет!` : ''}` +
      `${maxCombo >= 3 ? ` Макс. комбо: x${maxCombo}!` : ''}`,
    type: 'victory',
  });
  return entries;
}

/* ═══════════════════════════════════════════════════════════════
   §9.3 — Creep Finisher Rewards (realtime layer, v4.8.8)
   ═══════════════════════════════════════════════════════════════ */

/** Доля XP врага при добивании до боя (вместо полных наград победы). */
export const CREEP_FINISHER_XP_SCALE = 0.6;

/** Фиксированная карма за добивание (без боевых бонусов комбо). */
export const CREEP_FINISHER_KARMA = 2;

/** v4.11.0: надбавка XP за ТИХОЕ добивание из стелса (удар в спину
 *  неосведомлённого крипа): +25% к уже урезанному XP. */
export const CREEP_FINISHER_BACKSTAB_XP_BONUS = 0.25;

/** Вход `computeCreepFinisherRewards`. */
export interface ComputeCreepFinisherRewardsInput {
  /** xpReward шаблона врага (ENEMY_TEMPLATES[type].xpReward). */
  xpReward: number;
  /** Множитель кредитов сложности (difficultySettings.creditsMultiplier). */
  creditsMultiplier: number;
  /** v4.11.0: добивание из стелса (удар в спину) — +25% XP, карма
   *  неизменна, кредиты считаются от бонусного XP той же формулой. */
  backstab?: boolean;
}

/** Результат: урезанные награды добивания (без лута — трофеи выпадают
 *  только за честную победу в пошаговом бою). */
export interface ComputedCreepFinisherRewards {
  xpGained: number;
  karmaGained: number;
  creditsGained: number;
}

/**
 * Награды за добивание ослабленного крипа ударом до боя (creepVitality +
 * meleeStrike). Детерминировано — боевой RNG-сеанс не существует вне боя.
 * XP = 60% от шаблона (минимум 1) × (1 + 0.25 при тихом добивании из
 * стелса, v4.11.0), карма фиксированная, кредиты — по той же формуле
 * боевых кредитов от итогового XP. Честно дешевле полной победы: игрок
 * экономит ходы, но теряет лут и комбо-бонусы.
 */
export function computeCreepFinisherRewards(
  input: ComputeCreepFinisherRewardsInput,
): ComputedCreepFinisherRewards {
  const xpScale = CREEP_FINISHER_XP_SCALE * (input.backstab ? 1 + CREEP_FINISHER_BACKSTAB_XP_BONUS : 1);
  const xpGained = Math.max(
    1,
    Math.floor(Math.max(0, input.xpReward) * xpScale),
  );
  const multiplier = Number.isFinite(input.creditsMultiplier)
    ? Math.max(0, input.creditsMultiplier)
    : 1;
  const creditsGained = Math.max(1, Math.floor(computeCombatCredits(xpGained, 0) * multiplier));
  return { xpGained, karmaGained: CREEP_FINISHER_KARMA, creditsGained };
}

/* ═══════════════════════════════════════════════════════════════
   §9.2 — Defeat Penalty
   ═══════════════════════════════════════════════════════════════ */

/** Result of `computeDefeatPenalty`. */
export interface ComputedDefeatPenalty {
  /** Energy lost (15 + 0..9). Orchestrator dispatches `player/addEnergy` with `-energyLost`. */
  energyLost: number;
  /** Karma lost (5 + 0..4). Orchestrator dispatches `player/addKarma` with `-karmaLost`. */
  karmaLost: number;
  /** RNG state after both rolls. */
  rng: CombatRngState;
}

/**
 * Compute the penalty for losing a combat.
 *
 * Pure: rolls energyLost ∈ [15, 24] and karmaLost ∈ [5, 9] from the
 * combat RNG, returns the updated RNG state. The orchestrator dispatches
 * the corresponding game actions and assembles the defeat log line.
 */
export function computeDefeatPenalty(state: CombatState): ComputedDefeatPenalty {
  const defeatRng = SeededCombatRng.fromState(state.rng);
  const energyLost = 15 + defeatRng.nextInt(0, 9);
  const karmaLost = 5 + defeatRng.nextInt(0, 4);
  return { energyLost, karmaLost, rng: defeatRng.getState() };
}

/**
 * Build the defeat log entry.
 *
 * Pure helper — the orchestrator appends this to the existing combat log.
 *
 * Format (matches original): `💀 Поражение... -X энергии, -Y кармы. Вы отступаете.`
 */
export function buildDefeatLogEntry(
  turn: number,
  energyLost: number,
  karmaLost: number,
): CombatLogEntry {
  return {
    turn,
    text: `💀 Поражение... -${energyLost} энергии, -${karmaLost} кармы. Вы отступаете.`,
    type: 'defeat',
  };
}
