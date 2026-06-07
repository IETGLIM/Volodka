/* ─── Equipment stat/skill effect application ─── */

import type { ItemDefinition } from '@/data/items';
import type { TrainablePlayerSkill } from '@/shared/types/game';
import { clamp } from './shared';

export interface PlayerEquipmentStats {
  skills: Record<TrainablePlayerSkill, number>;
  energy: number;
  stress: number;
  karma: number;
}

function accumulateItemEffects(
  effects: ItemDefinition['effects'],
  sign: 1 | -1,
  skillChanges: Partial<Record<TrainablePlayerSkill, number>>,
  statDelta: { energy: number; stress: number; karma: number },
): void {
  for (const effect of effects) {
    if (effect.skill) {
      skillChanges[effect.skill] = (skillChanges[effect.skill] ?? 0) + sign * effect.value;
    } else if (effect.stat === 'energy') {
      statDelta.energy += sign * effect.value;
    } else if (effect.stat === 'stress') {
      statDelta.stress += sign * effect.value;
    } else if (effect.stat === 'karma') {
      statDelta.karma += sign * effect.value;
    }
  }
}

/** Apply or reverse equipment item effects on player skills and clamped stats. */
export function applyEquipmentEffects(
  stats: PlayerEquipmentStats,
  changes: {
    unequip?: ItemDefinition | null;
    equip?: ItemDefinition | null;
  },
): PlayerEquipmentStats {
  const skillChanges: Partial<Record<TrainablePlayerSkill, number>> = {};
  const statDelta = { energy: 0, stress: 0, karma: 0 };

  if (changes.unequip) {
    accumulateItemEffects(changes.unequip.effects, -1, skillChanges, statDelta);
  }
  if (changes.equip) {
    accumulateItemEffects(changes.equip.effects, 1, skillChanges, statDelta);
  }

  const skills = { ...stats.skills };
  for (const [skill, delta] of Object.entries(skillChanges)) {
    skills[skill as TrainablePlayerSkill] = Math.max(
      0,
      skills[skill as TrainablePlayerSkill] + (delta ?? 0),
    );
  }

  return {
    skills,
    energy: clamp(stats.energy + statDelta.energy, 0, 100),
    stress: clamp(stats.stress + statDelta.stress, 0, 100),
    karma: clamp(stats.karma + statDelta.karma, 0, 100),
  };
}
