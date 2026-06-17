import type { PlayerSkills, TrainablePlayerSkill } from '@/shared/types/game';
import { performSkillCheck } from '@/shared/validation/skillCheck';

export interface PoemSkillCheckResult {
  success: boolean;
  critical?: boolean;
  autoPass?: boolean;
  consumedFlag?: string;
}

interface PoemCheckFlagRule {
  flagKey: string;
  skills: TrainablePlayerSkill[];
  critical?: boolean;
}

export const POEM_SKILL_CHECK_FLAG_RULES: PoemCheckFlagRule[] = [
  { flagKey: 'synergy_voice_word_crit', skills: ['persuasion'], critical: true },
  { flagKey: 'synergy_storm_breakthrough_skip', skills: ['coding'] },
  { flagKey: 'truth_voice_active', skills: ['persuasion'] },
  { flagKey: 'breakthrough_active', skills: ['coding'] },
];

/** Pure skill-check resolution — callers consume `consumedFlag` via store dispatch. */
export function resolveSkillCheckWithPoemFlags(
  skill: TrainablePlayerSkill,
  difficulty: number,
  playerSkills: PlayerSkills,
  flags: Record<string, boolean>,
): PoemSkillCheckResult {
  for (const rule of POEM_SKILL_CHECK_FLAG_RULES) {
    if (!rule.skills.includes(skill)) continue;
    if (!flags[rule.flagKey]) continue;

    return {
      success: true,
      critical: rule.critical,
      autoPass: !rule.critical,
      consumedFlag: rule.flagKey,
    };
  }

  const success = performSkillCheck(skill, difficulty, playerSkills);
  return { success };
}
