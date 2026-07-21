/* ─── Volodka RPG – Thought Cabinet types (Disco Elysium inspired) ─── */

import type { TrainablePlayerSkill } from './skills';

export interface ThoughtCabinetEffect {
  readonly skill: TrainablePlayerSkill;
  readonly modifier: number;
  readonly description: string;
}

export interface ThoughtCabinetItem {
  readonly id: string;
  readonly name: string;
  readonly voice: TrainablePlayerSkill;
  readonly description: string;
  readonly flavorText: string;
  readonly acquisitionCondition: string;
  readonly acquisitionNode?: string;
  readonly mutuallyExclusive?: readonly string[];
  readonly effects: readonly ThoughtCabinetEffect[];
  readonly hidden?: boolean;
}