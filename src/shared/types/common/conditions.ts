/* ─── Shared story / dialogue / exit gates ─── */

import type { PlayerSkills, TrainablePlayerSkill } from '../definitions/skills';

/** Dialogue/story skill gate; difficulty validated as integer 1–20 at runtime. */
export interface MinSkillCheck {
  readonly skill: TrainablePlayerSkill;
  readonly difficulty: number;
}

/** Shared gate for story, dialogue, and scene-exit choices. */
export interface ChoiceCondition {
  readonly minKarma?: number;
  readonly maxKarma?: number;
  readonly minSkill?: Partial<PlayerSkills>;
  /** Probabilistic skill gate; difficulty is validated as integer 1–20 at runtime. */
  readonly minSkillCheck?: MinSkillCheck;
  readonly flag?: string;
  /** Hide when this flag is already set */
  readonly missingFlag?: string;
  /** G11: Minimum NPC relationship level required to see this choice */
  readonly minNpcRelation?: number;
  /** Minimum act required to see this choice (1 or 2) */
  readonly requiredAct?: number;
  /** G14: Time-of-day range when this choice is visible (hour: 0-24) */
  readonly minTimeOfDay?: number;
  /** G14: Time-of-day upper bound (hour: 0-24) */
  readonly maxTimeOfDay?: number;
  /** Show only when this poem is already collected */
  readonly collectedPoem?: string;
  /** Show only when this poem is not yet collected */
  readonly missingPoem?: string;
  /** Show only when the player owns this inventory item */
  readonly hasItem?: string;
  /** Minimum number of collected poems required */
  readonly minCollectedPoems?: number;
}

/** Alias for ChoiceCondition — used in exit filtering and story gates. */
export type Condition = ChoiceCondition;
