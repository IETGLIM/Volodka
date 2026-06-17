import {
  PASSIVE_SKILL_EFFECT_MAP,
  type PassiveSkillEffect,
} from '@/data/passiveSkillEffects';

export interface PassiveSkillModifiers {
  poemInCodeStrengthMultiplier: number;
  npcRelationGainMultiplier: number;
  poemPowerDurationMultiplier: number;
}

const DEFAULT_MODIFIERS: PassiveSkillModifiers = {
  poemInCodeStrengthMultiplier: 1,
  npcRelationGainMultiplier: 1,
  poemPowerDurationMultiplier: 1,
};

function applyPassiveEffect(
  modifiers: PassiveSkillModifiers,
  effect: PassiveSkillEffect,
): void {
  switch (effect.type) {
    case 'code_poem_effect_mult':
      modifiers.poemInCodeStrengthMultiplier = effect.value;
      break;
    case 'npc_relation_mult':
      modifiers.npcRelationGainMultiplier = effect.value;
      break;
    case 'poem_duration_mult':
      modifiers.poemPowerDurationMultiplier = effect.value;
      break;
    default: {
      const _exhaustive: never = effect;
      return _exhaustive;
    }
  }
}

function findPassiveEffect(
  unlockedSkills: readonly string[],
  flags: Record<string, boolean> | undefined,
  effectType: PassiveSkillEffect['type'],
): PassiveSkillEffect | null {
  for (const [skillId, def] of Object.entries(PASSIVE_SKILL_EFFECT_MAP)) {
    if (def.effect.type !== effectType) continue;
    if (unlockedSkills.includes(skillId) || flags?.[def.flag]) {
      return def.effect;
    }
  }
  return null;
}

export function getPassiveSkillModifiers(input: {
  unlockedSkills: readonly string[];
  flags?: Record<string, boolean>;
  codingSkill?: number;
}): PassiveSkillModifiers {
  const { unlockedSkills, flags, codingSkill = 0 } = input;
  const modifiers = { ...DEFAULT_MODIFIERS };

  const poemInCode = findPassiveEffect(unlockedSkills, flags, 'code_poem_effect_mult');
  if (poemInCode && codingSkill >= 5) {
    applyPassiveEffect(modifiers, poemInCode);
  }

  const relationRate = findPassiveEffect(unlockedSkills, flags, 'npc_relation_mult');
  if (relationRate) {
    applyPassiveEffect(modifiers, relationRate);
  }

  const poemDuration = findPassiveEffect(unlockedSkills, flags, 'poem_duration_mult');
  if (poemDuration) {
    applyPassiveEffect(modifiers, poemDuration);
  }

  return modifiers;
}

export function scaleNpcRelationDelta(
  delta: number,
  unlockedSkills: readonly string[],
  flags?: Record<string, boolean>,
): number {
  if (delta <= 0) return delta;
  const { npcRelationGainMultiplier } = getPassiveSkillModifiers({ unlockedSkills, flags });
  if (npcRelationGainMultiplier === 1) return delta;
  return Math.round(delta * npcRelationGainMultiplier);
}

export function scalePoemPowerDurationMs(
  durationMs: number,
  unlockedSkills: readonly string[],
  flags?: Record<string, boolean>,
): number {
  const { poemPowerDurationMultiplier } = getPassiveSkillModifiers({ unlockedSkills, flags });
  if (poemPowerDurationMultiplier === 1) return durationMs;
  return Math.round(durationMs * poemPowerDurationMultiplier);
}

export function scalePoemPowerSkillDelta(
  amount: number,
  unlockedSkills: readonly string[],
  flags: Record<string, boolean> | undefined,
  codingSkill: number,
): number {
  if (amount <= 0) return amount;
  const { poemInCodeStrengthMultiplier } = getPassiveSkillModifiers({
    unlockedSkills,
    flags,
    codingSkill,
  });
  if (poemInCodeStrengthMultiplier === 1) return amount;
  return Math.round(amount * poemInCodeStrengthMultiplier);
}

/** Scale combat poem HP changes (healing / damage) when tech_t5 is active. */
export function scaleCombatPoemHpDelta(
  delta: number,
  unlockedSkills: readonly string[],
  flags: Record<string, boolean> | undefined,
  codingSkill: number,
): number {
  if (delta <= 0) return delta;
  const { poemInCodeStrengthMultiplier } = getPassiveSkillModifiers({
    unlockedSkills,
    flags,
    codingSkill,
  });
  if (poemInCodeStrengthMultiplier === 1) return delta;
  return Math.round(delta * poemInCodeStrengthMultiplier);
}

export function getPassiveSkillFlagsToSet(skillId: string): string[] {
  const def = PASSIVE_SKILL_EFFECT_MAP[skillId];
  return def ? [def.flag] : [];
}
