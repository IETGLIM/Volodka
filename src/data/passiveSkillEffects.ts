/* ─── Volodka RPG – Passive skill tree ultimate effects ─── */
/* Tier-5 nodes use freeform Russian display strings; gameplay hooks use skill IDs. */

import type { TrainablePlayerSkill } from '@/shared/types/game';

/** Passive multipliers applied at runtime (tier-5 ultimates). */
export type PassiveSkillEffect =
  | { type: 'poem_duration_mult'; value: number }
  | { type: 'code_poem_effect_mult'; value: number }
  | { type: 'npc_relation_mult'; value: number };

/** Structured skill unlock effect — replaces regex for mapped nodes. */
export type SkillEffect =
  | { type: 'stat_add'; skill: TrainablePlayerSkill; value: number }
  | PassiveSkillEffect;

export interface PassiveSkillUnlockDef {
  effect: PassiveSkillEffect;
  /** Persisted player flag set on unlock */
  flag: string;
}

export const PASSIVE_SKILL_EFFECT_MAP: Record<string, PassiveSkillUnlockDef> = {
  tech_t5_ultimate: {
    effect: { type: 'code_poem_effect_mult', value: 2 },
    flag: 'passive_poem_in_code_double',
  },
  social_t5_ultimate: {
    effect: { type: 'npc_relation_mult', value: 1.5 },
    flag: 'passive_npc_relation_rate',
  },
  spirit_t5_ultimate: {
    effect: { type: 'poem_duration_mult', value: 2 },
    flag: 'passive_poem_power_duration',
  },
};

export const PASSIVE_SKILL_EFFECT_SKILL_IDS = Object.keys(PASSIVE_SKILL_EFFECT_MAP);
