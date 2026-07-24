/**
 * Faction reputation propagation — when you help/harm one NPC,
 * their faction-mates feel a diluted echo of the change.
 *
 * Makes the world feel reactive (Gothic-style guild reputation).
 * Uses the existing setNpcRelation fairmath system for each
 * propagated change, so diminishing returns still apply.
 */

import { ALL_NPC_DEFINITIONS } from '@/data/allNpcDefinitions';
import { dispatchGameAction } from '@/engine/GameActionDispatcher';

/** Fraction of the original relation delta applied to faction-mates. */
export const FACTION_PROPAGATION_FACTOR = 0.3;

/** Minimum |delta| that triggers propagation (skip trivial changes). */
const FACTION_PROPAGATION_MIN_DELTA = 3;

/**
 * After a direct relation change to `targetNpcId`, propagate a diluted
 * relation change to all other NPCs sharing the same faction.
 *
 * Uses dispatchGameAction for each propagated change so the existing
 * fairmath + perk + skill multipliers in setNpcRelation apply.
 */
export function propagateFactionRelationChange(
  targetNpcId: string,
  rawDelta: number,
): void {
  if (Math.abs(rawDelta) < FACTION_PROPAGATION_MIN_DELTA) return;

  const targetNpc = ALL_NPC_DEFINITIONS.find((n) => n.id === targetNpcId);
  if (!targetNpc?.faction) return;

  const faction = targetNpc.faction;
  const propagatedDelta = Math.round(rawDelta * FACTION_PROPAGATION_FACTOR);
  if (propagatedDelta === 0) return;

  for (const npc of ALL_NPC_DEFINITIONS) {
    if (npc.id === targetNpcId) continue;
    if (npc.faction !== faction) continue;
    dispatchGameAction({
      type: 'player/setNpcRelation',
      npcId: npc.id,
      delta: propagatedDelta,
    });
  }
}
