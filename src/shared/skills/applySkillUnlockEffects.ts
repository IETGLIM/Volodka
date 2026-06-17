import type { TrainablePlayerSkill } from '@/shared/types/game';
import { SKILL_EFFECT_MAP } from '@/data/skillTree';
import { PASSIVE_SKILL_EFFECT_MAP } from '@/data/passiveSkillEffects';
import { getPassiveSkillFlagsToSet } from '@/shared/skills/passiveSkillModifiers';
import { isTrainablePlayerSkill, warnInvalidValue } from '@/shared/validation/typeGuards';

const LEGACY_PERCENT_FLAG_PREFIX = 'legacy_skill_percent_';

export interface SkillUnlockStatDelta {
  skill: TrainablePlayerSkill;
  amount: number;
}

export interface SkillUnlockApplyResult {
  statDeltas: SkillUnlockStatDelta[];
  passiveFlags: string[];
  legacyPercentFlags: Array<{ key: string; value: number }>;
  unmatchedEffectParts: string[];
}

/** Structured legacy combat-tree bonuses keyed by node id (actions.ts SKILL_TREE). */
const LEGACY_COMBAT_SKILL_PERCENT: Record<string, Array<{ key: string; value: number }>> = {
  tech_4a: [{ key: 'legacy_flee_chance', value: 0.2 }],
  tech_5a: [{ key: 'legacy_poem_power_strength', value: 0.25 }],
  tech_5b: [{ key: 'legacy_combat_attack', value: 0.5 }],
  social_2a: [{ key: 'legacy_flee_chance', value: 0.15 }],
  social_2b: [{ key: 'legacy_npc_relation_rate', value: 0.2 }],
  social_4a: [{ key: 'legacy_quest_reward_rate', value: 0.3 }],
  social_4b: [{ key: 'legacy_healing_rate', value: 0.5 }],
  social_5b: [{ key: 'legacy_combat_defense', value: 0.5 }],
  spiritual_2b: [{ key: 'legacy_poem_power_strength', value: 0.1 }],
  spiritual_3b: [{ key: 'legacy_stress_reduction', value: 0.2 }],
  spiritual_4b: [{ key: 'legacy_poem_cooldown_reduction', value: 0.25 }],
  spiritual_5b: [{ key: 'legacy_poem_power_strength', value: 1 }],
};

function parseEffectString(effect: string): SkillUnlockApplyResult {
  const result: SkillUnlockApplyResult = {
    statDeltas: [],
    passiveFlags: [],
    legacyPercentFlags: [],
    unmatchedEffectParts: [],
  };

  const parts = effect.split(', ');
  for (const part of parts) {
    const statMatch = part.match(/^(\w+)\s*\+(\d+)(%)?$/);
    if (statMatch) {
      const stat = statMatch[1];
      const value = parseInt(statMatch[2], 10);
      const isPercent = !!statMatch[3];
      if (isPercent) {
        result.legacyPercentFlags.push({
          key: `${LEGACY_PERCENT_FLAG_PREFIX}${stat}`,
          value,
        });
      } else if (isTrainablePlayerSkill(stat)) {
        result.statDeltas.push({ skill: stat, amount: value });
      } else {
        result.unmatchedEffectParts.push(part);
      }
      continue;
    }

    const signedPercentMatch = part.match(/^(\w+)\s*([+-])(\d+)%$/);
    if (signedPercentMatch) {
      const stat = signedPercentMatch[1];
      const sign = signedPercentMatch[2] === '-' ? -1 : 1;
      const value = parseInt(signedPercentMatch[3], 10) * sign;
      result.legacyPercentFlags.push({
        key: `${LEGACY_PERCENT_FLAG_PREFIX}${stat}`,
        value,
      });
      continue;
    }

    result.unmatchedEffectParts.push(part);
  }

  return result;
}

/** Resolve unlock bonuses for a skill tree node id + optional legacy effect string. */
export function resolveSkillUnlockEffects(skillId: string, effect?: string): SkillUnlockApplyResult {
  const result: SkillUnlockApplyResult = {
    statDeltas: [],
    passiveFlags: getPassiveSkillFlagsToSet(skillId),
    legacyPercentFlags: [],
    unmatchedEffectParts: [],
  };

  const mapped = SKILL_EFFECT_MAP[skillId];
  if (mapped) {
    result.statDeltas.push({ skill: mapped.skill, amount: mapped.value });
  }

  if (PASSIVE_SKILL_EFFECT_MAP[skillId]) {
    return result;
  }

  if (mapped) {
    return result;
  }

  const legacyPercents = LEGACY_COMBAT_SKILL_PERCENT[skillId];
  if (legacyPercents) {
    result.legacyPercentFlags.push(...legacyPercents);
  }

  if (effect) {
    const parsed = parseEffectString(effect);
    result.statDeltas.push(...parsed.statDeltas);
    result.legacyPercentFlags.push(...parsed.legacyPercentFlags);
    result.unmatchedEffectParts.push(...parsed.unmatchedEffectParts);
  }

  return result;
}

export function warnUnmatchedSkillEffectParts(skillId: string, parts: string[]): void {
  if (parts.length === 0) return;
  if (import.meta.env.DEV) {
    console.warn(
      `[applySkillEffect] Unmatched effect parts for "${skillId}": ${parts.join('; ')}`,
    );
  } else {
    warnInvalidValue('skill effect parts', `${skillId}: ${parts.join(', ')}`);
  }
}
