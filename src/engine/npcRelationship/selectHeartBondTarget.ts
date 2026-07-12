import { findNpcById } from '@/data/allNpcDefinitions';
import type { NPCRelation } from '@/shared/types/game';

/** Minimum relation value to qualify for heart-bond / closest-NPC poem bonuses. */
export const HEART_BOND_MIN_RELATION_VALUE = 1;

/** Minimum relation value before heart_bond synergy applies its +20 bonus. */
export const HEART_BOND_BONUS_MIN_VALUE = 30;

export function hasNpcMetFlag(npcId: string, flags: Record<string, boolean>): boolean {
  return (
    flags[`met_${npcId}`] === true
    || flags[`splash_seen_npc_${npcId}`] === true
    || flags[`talked_to_${npcId}`] === true
  );
}

/** Story-active registry NPC — excludes unknown / stale save ids. */
export function isStoryActiveNpc(npcId: string): boolean {
  return findNpcById(npcId) != null;
}

export function isHeartBondEligible(
  relation: NPCRelation,
  flags: Record<string, boolean>,
  minRelation = HEART_BOND_MIN_RELATION_VALUE,
): boolean {
  if (!isStoryActiveNpc(relation.npcId)) return false;
  if (relation.value < minRelation) return false;
  // Explicit met flags, or a positive persisted relation row (setNpcRelation after contact).
  return hasNpcMetFlag(relation.npcId, flags) || relation.value >= minRelation;
}

export function selectHeartBondTarget(
  relations: readonly NPCRelation[],
  flags: Record<string, boolean>,
  minRelation = HEART_BOND_MIN_RELATION_VALUE,
): NPCRelation | null {
  const eligible = relations.filter((relation) => isHeartBondEligible(relation, flags, minRelation));
  if (eligible.length === 0) return null;
  return eligible.reduce((best, current) => (current.value > best.value ? current : best));
}
