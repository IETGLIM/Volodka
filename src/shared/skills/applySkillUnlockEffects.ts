import type { TrainablePlayerSkill } from '@/shared/types/game';
import { SKILL_EFFECT_MAP } from '@/data/skillTree';
import { getPassiveSkillFlagsToSet } from '@/shared/skills/passiveSkillModifiers';
import { warnInvalidValue } from '@/shared/validation/typeGuards';

export interface SkillUnlockStatDelta {
  skill: TrainablePlayerSkill;
  amount: number;
}

export interface SkillUnlockApplyResult {
  statDeltas: SkillUnlockStatDelta[];
  passiveFlags: string[];
}

/**
 * Resolve unlock bonuses for a skill tree node id.
 *
 * The active skill tree lives in `data/skillTree.ts` (`SKILL_TREE_NODES` /
 * `SKILL_TREE_MAP`). Each node either:
 *   - carries a flat stat bonus registered in `SKILL_EFFECT_MAP`, or
 *   - carries a passive flag registered in `PASSIVE_SKILL_EFFECT_MAP`.
 *
 * Previously this resolver also supported a legacy percent-bonus system
 * (`LEGACY_COMBAT_SKILL_PERCENT`, `legacyPercentFlags`) that mapped
 * `combat/actions.ts` `SKILL_TREE` node ids (tech_4a, tech_5a, etc.) to
 * `legacy_*` flags. Those flags were SET on unlock but NEVER read by any
 * gameplay formula — pure dead code. The legacy `SKILL_TREE` in
 * `combat/actions.ts` has been removed; this resolver now only returns
 * structured stat deltas and passive flags.
 */
export function resolveSkillUnlockEffects(skillId: string): SkillUnlockApplyResult {
  const result: SkillUnlockApplyResult = {
    statDeltas: [],
    passiveFlags: getPassiveSkillFlagsToSet(skillId),
  };

  const mapped = SKILL_EFFECT_MAP[skillId];
  if (mapped) {
    result.statDeltas.push({ skill: mapped.skill, amount: mapped.value });
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
