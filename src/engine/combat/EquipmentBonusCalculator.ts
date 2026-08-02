/* ─── Equipment Combat Bonus Calculator ─── */
/* Pure engine file — no React or store imports. */

import type { EquipmentSlot, TrainablePlayerSkill } from '@/shared/types/game';
import { getItemDefinition } from '@/data/gameDataLoader';

/** Minimal equipped item representation from the game snapshot. */
export type EquippedItemSnapshot = { id: string } | null;

/** Result of calculating equipment bonuses for a skill. */
export interface EquipmentBonusResult {
  /** Total flat bonus to add to the skill value. */
  flat: number;
  /** Total percent multiplier (e.g. 0.05 = +5%). Apply as: value * (1 + percent). */
  percent: number;
}

/** Empty result — returned when no bonuses apply. */
export const EMPTY_BONUS: EquipmentBonusResult = { flat: 0, percent: 0 };

/**
 * Calculate the total combat bonus for a specific skill from all equipped items.
 *
 * @param equippedItems - Map of slot → item (or null) from the game snapshot.
 * @param skillName - The skill to compute bonuses for.
 * @returns Combined flat and percent bonuses.
 */
export function calculateEquipmentBonus(
  equippedItems: Partial<Record<EquipmentSlot, EquippedItemSnapshot>>,
  skillName: TrainablePlayerSkill,
): EquipmentBonusResult {
  let flat = 0;
  let percent = 0;

  for (const entry of Object.values(equippedItems)) {
    if (!entry) continue;

    const def = getItemDefinition(entry.id);
    if (!def?.combatBonus) continue;

    for (const bonus of def.combatBonus) {
      // Bonuses without a specific skill apply to everything (generic percent).
      if (!bonus.skill) {
        if (bonus.type === 'flat') flat += bonus.value;
        else percent += bonus.value / 100;
        continue;
      }

      if (bonus.skill === skillName) {
        if (bonus.type === 'flat') flat += bonus.value;
        else percent += bonus.value / 100;
      }
    }
  }

  return { flat, percent };
}

/**
 * Compute the final skill value after applying equipment combat bonuses.
 *
 * @param baseSkill - The raw skill value (from snapshot playerState.skills).
 * @param equippedItems - Currently equipped items.
 * @param skillName - Which skill is being resolved.
 * @returns The skill value with flat bonuses added and percent multiplier applied.
 */
export function applyEquipmentBonusToSkill(
  baseSkill: number,
  equippedItems: Partial<Record<EquipmentSlot, EquippedItemSnapshot>>,
  skillName: TrainablePlayerSkill,
): number {
  const { flat, percent } = calculateEquipmentBonus(equippedItems, skillName);
  return Math.floor((baseSkill + flat) * (1 + percent));
}

/**
 * Check if any equipped item provides a combat bonus for the given skill.
 * Useful for UI indicator display.
 */
export function hasEquipmentBonusForSkill(
  equippedItems: Partial<Record<EquipmentSlot, EquippedItemSnapshot>>,
  skillName: TrainablePlayerSkill,
): boolean {
  return calculateEquipmentBonus(equippedItems, skillName).flat > 0
    || calculateEquipmentBonus(equippedItems, skillName).percent > 0;
}

/**
 * Get total flat + percent bonus across all equipped items for a given skill.
 * Returns a single numeric summary (flat + percent as approximate points) for UI.
 */
export function getTotalEquipmentBonusSummary(
  equippedItems: Partial<Record<EquipmentSlot, EquippedItemSnapshot>>,
  skillName: TrainablePlayerSkill,
  baseSkill: number,
): number {
  const { flat, percent } = calculateEquipmentBonus(equippedItems, skillName);
  return Math.floor((baseSkill + flat) * (1 + percent)) - baseSkill;
}
