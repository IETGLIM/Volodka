/* ─── Volodka RPG – shared story/dialogue condition checks ─── */

import type {
  DialogueChoice,
  NPCRelation,
  PlayerSkills,
  PlayerState,
  StoryChoice,
  TrainablePlayerSkill,
} from '@/shared/types/game';
import { performSkillCheck } from '@/shared/validation/skillCheck';

export type StoryCondition = StoryChoice['condition'] | DialogueChoice['condition'];

export interface StoryConditionContext {
  karma: number;
  skills: PlayerSkills;
  flags: Record<string, boolean>;
  currentAct: number;
  npcRelations?: NPCRelation[];
  npcId?: string;
  timeOfDay?: number;
}

export interface StoryConditionExtras {
  npcRelations?: NPCRelation[];
  npcId?: string;
  timeOfDay?: number;
  /** Override act; defaults to playerState.progression.currentAct */
  currentAct?: number;
}

/** Build condition context from player state — shared by StoryRenderer & DialogueRenderer. */
export function buildStoryConditionContext(
  playerState: Pick<PlayerState, 'karma' | 'skills' | 'flags' | 'progression'>,
  extras: StoryConditionExtras = {},
): StoryConditionContext {
  return {
    karma: playerState.karma,
    skills: playerState.skills,
    flags: playerState.flags,
    currentAct: extras.currentAct ?? playerState.progression.currentAct,
    npcRelations: extras.npcRelations,
    npcId: extras.npcId,
    timeOfDay: extras.timeOfDay,
  };
}

export interface StoryConditionResult {
  pass: boolean;
  /** Story overlay: minSkill gate display */
  skillCheck?: { skill: TrainablePlayerSkill; needed: number; current: number };
  skillCheckResult?: { skill: TrainablePlayerSkill; difficulty: number; success: boolean };
  skillCheckNeeded?: { skill: TrainablePlayerSkill; needed: number; current: number };
  relationNeeded?: { needed: number; current: number };
  actNeeded?: { needed: number; current: number };
  karmaNeeded?: { type: 'min' | 'max'; needed: number; current: number };
}

export function checkStoryCondition(
  condition: StoryCondition | undefined,
  ctx: StoryConditionContext,
): StoryConditionResult {
  if (!condition) return { pass: true };

  if (condition.requiredAct !== undefined && ctx.currentAct < condition.requiredAct) {
    return { pass: false, actNeeded: { needed: condition.requiredAct, current: ctx.currentAct } };
  }

  if (ctx.timeOfDay !== undefined) {
    if (condition.minTimeOfDay !== undefined && ctx.timeOfDay < condition.minTimeOfDay) return { pass: false };
    if (condition.maxTimeOfDay !== undefined && ctx.timeOfDay > condition.maxTimeOfDay) return { pass: false };
  }

  if (condition.minKarma !== undefined && ctx.karma < condition.minKarma) {
    return { pass: false, karmaNeeded: { type: 'min', needed: condition.minKarma, current: ctx.karma } };
  }
  if (condition.maxKarma !== undefined && ctx.karma > condition.maxKarma) {
    return { pass: false, karmaNeeded: { type: 'max', needed: condition.maxKarma, current: ctx.karma } };
  }

  if (condition.flag && !ctx.flags[condition.flag]) return { pass: false };

  if (condition.minNpcRelation !== undefined && ctx.npcId && ctx.npcRelations) {
    const rel = ctx.npcRelations.find((r) => r.npcId === ctx.npcId);
    const currentRel = rel?.value ?? 50;
    if (currentRel < condition.minNpcRelation) {
      return { pass: false, relationNeeded: { needed: condition.minNpcRelation, current: currentRel } };
    }
  }

  if (condition.minSkill) {
    for (const [skill, needed] of Object.entries(condition.minSkill)) {
      const current = ctx.skills[skill as TrainablePlayerSkill] ?? 0;
      if (current < (needed as number)) {
        const skillGate = {
          skill: skill as TrainablePlayerSkill,
          needed: needed as number,
          current,
        };
        return {
          pass: false,
          skillCheck: skillGate,
          skillCheckNeeded: skillGate,
        };
      }
    }
  }

  if (condition.minSkillCheck) {
    const { skill, difficulty } = condition.minSkillCheck;
    const success = performSkillCheck(skill, difficulty, ctx.skills);
    return { pass: success, skillCheckResult: { skill, difficulty, success } };
  }

  return { pass: true };
}
