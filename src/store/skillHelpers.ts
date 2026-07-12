/* ─── Trainable skill mutations with runtime key validation ─── */

import type { TrainablePlayerSkill } from '@/shared/types/game';
import { isTrainablePlayerSkill, warnInvalidValue } from '@/shared/validation/typeGuards';

/** Apply a delta when `skillKey` is a known trainable skill; otherwise skip and warn in dev. */
export function applySkillDelta(
  skills: Record<TrainablePlayerSkill, number>,
  skillKey: unknown,
  delta: number,
  context: string,
): void {
  if (!isTrainablePlayerSkill(skillKey)) {
    warnInvalidValue(context, skillKey);
    return;
  }
  skills[skillKey] = Math.max(0, skills[skillKey] + delta);
}

/** Parse external skill id (perk/achievement data) before batch reward application. */
export function parseTrainablePlayerSkill(
  value: unknown,
  context: string,
): TrainablePlayerSkill | null {
  if (isTrainablePlayerSkill(value)) return value;
  warnInvalidValue(context, value);
  return null;
}
