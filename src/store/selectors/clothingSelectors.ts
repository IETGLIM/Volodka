/* ─── Volodka RPG – Clothing/Appearance selectors ───
 * Selectors for equipped clothing, social perception tags,
 * skill modifiers, and dialogue modifiers from outfit.
 */

import type { EquipmentSlot, InventoryItem } from '@/shared/types/game';
import type { TrainablePlayerSkill } from '@/shared/types/definitions/skills';
import type { DialogueModifier } from '@/shared/types/definitions/items';
import type { SocialPerceptionTag, ClothingDefinition } from '@/data/clothingCatalog';
import { getClothingById } from '@/data/clothingCatalog';
import { useGameSelector } from './hooks';

/* ─── Types ─── */

/** Combined clothing skill modifiers from all equipped items. */
export type ClothingSkillModifiers = Partial<Record<TrainablePlayerSkill, number>>;

/** Combined dialogue modifier from all equipped clothing. */
export interface CombinedDialogueModifier {
  /** Total DC adjustment from all clothing (sum of individual dcAdjustments). */
  dcAdjustment: number;
  /** Skill bonuses summed across all equipped clothing. */
  skillBonus: ClothingSkillModifiers;
  /** Tags that unlock dialogue branches (union of all unlockTags). */
  unlockTags: string[];
  /** Tags that lock dialogue branches (union of all lockTags). */
  lockTags: string[];
}

/* ─── Pure selector functions (non-React) ─── */

/** Returns all currently equipped items (non-null entries). */
export function getEquippedClothing(
  equippedItems: Record<EquipmentSlot, InventoryItem | null>,
): InventoryItem[] {
  const result: InventoryItem[] = [];
  for (const slot of Object.values(equippedItems)) {
    if (slot !== null) {
      result.push(slot);
    }
  }
  return result;
}

/** Returns combined social perception tags from all equipped clothing. */
export function getSocialPerceptionTags(
  equippedItems: Record<EquipmentSlot, InventoryItem | null>,
): SocialPerceptionTag[] {
  const tags = new Set<SocialPerceptionTag>();
  for (const item of getEquippedClothing(equippedItems)) {
    const clothing = getClothingById(item.id as string);
    if (clothing) {
      for (const tag of clothing.socialPerception) {
        tags.add(tag);
      }
    }
  }
  return [...tags];
}

/** Returns total skill modifiers from all equipped clothing. */
export function getClothingSkillModifiers(
  equippedItems: Record<EquipmentSlot, InventoryItem | null>,
): ClothingSkillModifiers {
  const modifiers: ClothingSkillModifiers = {};
  for (const item of getEquippedClothing(equippedItems)) {
    const clothing = getClothingById(item.id as string);
    if (clothing) {
      for (const effect of clothing.effects) {
        if (effect.skill) {
          modifiers[effect.skill] = (modifiers[effect.skill] ?? 0) + effect.value;
        }
      }
    }
  }
  return modifiers;
}

/** Returns combined dialogue modifiers from all equipped clothing. */
export function getClothingDialogueModifier(
  equippedItems: Record<EquipmentSlot, InventoryItem | null>,
): CombinedDialogueModifier {
  const unlockSet = new Set<string>();
  const lockSet = new Set<string>();
  let dcAdjustment = 0;
  const skillBonus: ClothingSkillModifiers = {};

  for (const item of getEquippedClothing(equippedItems)) {
    const clothing = getClothingById(item.id as string);
    if (clothing?.dialogueModifier) {
      const dm = clothing.dialogueModifier;
      if (dm.dcAdjustment !== undefined) {
        dcAdjustment += dm.dcAdjustment;
      }
      if (dm.skillBonus) {
        for (const [skill, value] of Object.entries(dm.skillBonus)) {
          if (value !== undefined) {
            skillBonus[skill as TrainablePlayerSkill] =
              (skillBonus[skill as TrainablePlayerSkill] ?? 0) + value;
          }
        }
      }
      if (dm.unlockTag) {
        unlockSet.add(dm.unlockTag);
      }
      if (dm.lockTag) {
        lockSet.add(dm.lockTag);
      }
    }
  }

  return {
    dcAdjustment,
    skillBonus,
    unlockTags: [...unlockSet],
    lockTags: [...lockSet],
  };
}

/** Get the ClothingDefinition for an equipped item, if it's in the clothing catalog. */
export function getClothingDefinitionForEquipped(
  item: InventoryItem | null,
): ClothingDefinition | undefined {
  if (!item) return undefined;
  return getClothingById(item.id as string);
}

/* ─── React hooks ─── */

/** Hook: all currently equipped clothing items. */
export function useEquippedClothing(): InventoryItem[] {
  return useGameSelector((s) => getEquippedClothing(s.playerState.equippedItems));
}

/** Hook: combined social perception tags from outfit. */
export function useSocialPerceptionTags(): SocialPerceptionTag[] {
  return useGameSelector((s) => getSocialPerceptionTags(s.playerState.equippedItems));
}

/** Hook: total skill modifiers from clothing. */
export function useClothingSkillModifiers(): ClothingSkillModifiers {
  return useGameSelector((s) => getClothingSkillModifiers(s.playerState.equippedItems));
}

/** Hook: combined dialogue modifier from outfit. */
export function useClothingDialogueModifier(): CombinedDialogueModifier {
  return useGameSelector((s) => getClothingDialogueModifier(s.playerState.equippedItems));
}
