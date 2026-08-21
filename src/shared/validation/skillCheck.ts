/* ─── Volodka RPG – skill check difficulty validation ─── */

import { z } from 'zod';
import type { MinSkillCheck, PlayerSkills, TrainablePlayerSkill } from '@/shared/types/game';

import { devWarn } from '@/shared/utils/devLog';
export const SKILL_CHECK_DIFFICULTY_MIN = 1;
export const SKILL_CHECK_DIFFICULTY_MAX = 20;

const TrainablePlayerSkillSchema = z.enum([
  'logic',
  'coding',
  'empathy',
  'persuasion',
  'intuition',
  'writing',
  'rhythm',
]);

export const SkillCheckDifficultySchema = z
  .number()
  .int()
  .min(SKILL_CHECK_DIFFICULTY_MIN)
  .max(SKILL_CHECK_DIFFICULTY_MAX);

export const MinSkillCheckSchema = z.object({
  skill: TrainablePlayerSkillSchema,
  difficulty: SkillCheckDifficultySchema,
});

/** Parse difficulty; returns null and warns in dev when invalid. */
export function parseSkillCheckDifficulty(
  raw: number,
  context = 'skill check',
): number | null {
  const result = SkillCheckDifficultySchema.safeParse(raw);
  if (result.success) return result.data;

  if (import.meta.env.DEV) {
    devWarn(
      `[SkillCheck] Invalid difficulty ${JSON.stringify(raw)} in ${context} (expected integer ${SKILL_CHECK_DIFFICULTY_MIN}–${SKILL_CHECK_DIFFICULTY_MAX})`,
      result.error.issues,
    );
  }
  return null;
}

export function validateMinSkillCheck(
  check: MinSkillCheck,
  context = 'minSkillCheck',
): MinSkillCheck | null {
  const result = MinSkillCheckSchema.safeParse(check);
  if (result.success) return result.data as MinSkillCheck;

  if (import.meta.env.DEV) {
    devWarn(`[SkillCheck] Invalid minSkillCheck in ${context}`, result.error.issues);
  }
  return null;
}

/** Fail-safe: invalid difficulty rejects the check (returns false). */
export function performSkillCheck(
  skill: TrainablePlayerSkill,
  difficulty: number,
  playerSkills: PlayerSkills,
  context?: string,
): boolean {
  const validDifficulty = parseSkillCheckDifficulty(
    difficulty,
    context ?? `skill:${skill}`,
  );
  if (validDifficulty === null) return false;
  return (playerSkills[skill] ?? 0) >= validDifficulty;
}
