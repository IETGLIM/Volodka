import type { PlayerSkills } from '@/data/types';

/** Навыки, которые можно кача через addSkill (без skillPoints). */
export type TrainablePlayerSkill = Exclude<keyof PlayerSkills, 'skillPoints'>;

const TRAINABLE = new Set<string>([
  'writing',
  'perception',
  'empathy',
  'imagination',
  'logic',
  'coding',
  'persuasion',
  'intuition',
  'resilience',
  'introspection',
]);

export function asTrainablePlayerSkill(skill: string): TrainablePlayerSkill | null {
  return TRAINABLE.has(skill) ? (skill as TrainablePlayerSkill) : null;
}
