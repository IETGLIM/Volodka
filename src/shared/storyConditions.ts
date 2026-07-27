/* ─── Volodka RPG – shared story/dialogue condition checks ─── */

import type {
  DialogueChoice,
  NPCRelation,
  PlayerSkills,
  PlayerState,
  StoryChoice,
  TrainablePlayerSkill,
} from '@/shared/types/game';
import { isActiveTTLFlagLive, type ActiveTTLFlagMap } from '@/shared/activeTTLFlags';
import { resolveSkillCheckWithPoemFlags } from '@/shared/poemPower/poemSkillCheckRules';

export type StoryCondition = StoryChoice['condition'] | DialogueChoice['condition'];

export interface StoryConditionContext {
  karma: number;
  skills: PlayerSkills;
  flags: Record<string, boolean>;
  collectedPoems: readonly string[];
  activeTTLFlags?: ActiveTTLFlagMap;
  currentAct: number;
  npcRelations?: NPCRelation[];
  npcId?: string;
  timeOfDay?: number;
  /** Pipe-delimited sorted item ids from player inventory */
  ownedItemIdsKey?: string;
  /** Clothing unlock tags from equipped outfit (for dialogue gating). */
  clothingUnlockTags?: readonly string[];
  /** Clothing lock tags from equipped outfit (for dialogue gating). */
  clothingLockTags?: readonly string[];
}

export interface StoryConditionExtras {
  npcRelations?: NPCRelation[];
  npcId?: string;
  timeOfDay?: number;
  /** Override act; defaults to playerState.progression.currentAct */
  currentAct?: number;
  ownedItemIdsKey?: string;
  activeTTLFlags?: ActiveTTLFlagMap;
  /** Clothing unlock tags from equipped outfit. */
  clothingUnlockTags?: readonly string[];
  /** Clothing lock tags from equipped outfit. */
  clothingLockTags?: readonly string[];
}

/** Build condition context from player state — shared by StoryRenderer & DialogueRenderer. */
export function buildStoryConditionContext(
  playerState: Pick<PlayerState, 'karma' | 'skills' | 'flags' | 'progression'>,
  extras: StoryConditionExtras = {},
  collectedPoems: readonly string[] = [],
): StoryConditionContext {
  return {
    karma: playerState.karma,
    skills: playerState.skills,
    flags: playerState.flags,
    collectedPoems,
    activeTTLFlags: extras.activeTTLFlags,
    currentAct: extras.currentAct ?? playerState.progression.currentAct,
    npcRelations: extras.npcRelations,
    npcId: extras.npcId,
    timeOfDay: extras.timeOfDay,
    ownedItemIdsKey: extras.ownedItemIdsKey,
    clothingUnlockTags: extras.clothingUnlockTags,
    clothingLockTags: extras.clothingLockTags,
  };
}

export interface StoryConditionResult {
  pass: boolean;
  /** Story overlay: minSkill gate display */
  skillCheck?: { skill: TrainablePlayerSkill; needed: number; current: number };
  skillCheckResult?: {
    skill: TrainablePlayerSkill;
    difficulty: number;
    success: boolean;
    critical?: boolean;
    autoPass?: boolean;
    consumedFlag?: string;
  };
  /** Poem flag consumed by a passing skill check — apply via store after choice selection. */
  consumedFlag?: string;
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

  if (condition.missingFlag && ctx.flags[condition.missingFlag]) return { pass: false };

  if (condition.activeTTLFlag
    && !isActiveTTLFlagLive(ctx.activeTTLFlags, condition.activeTTLFlag)) {
    return { pass: false };
  }
  if (condition.missingActiveTTLFlag
    && isActiveTTLFlagLive(ctx.activeTTLFlags, condition.missingActiveTTLFlag)) {
    return { pass: false };
  }

  if (condition.collectedPoem && !ctx.collectedPoems.includes(condition.collectedPoem)) {
    return { pass: false };
  }
  if (condition.missingPoem && ctx.collectedPoems.includes(condition.missingPoem)) {
    return { pass: false };
  }

  if (condition.hasItem !== undefined) {
    const owned = ctx.ownedItemIdsKey ? ctx.ownedItemIdsKey.split('|') : [];
    if (!owned.includes(condition.hasItem)) return { pass: false };
  }

  if (condition.minCollectedPoems !== undefined) {
    if (ctx.collectedPoems.length < condition.minCollectedPoems) return { pass: false };
  }

  // Clothing tag gating: outfit-based dialogue branch access
  if (condition.clothingTagRequired !== undefined) {
    const unlockTags = ctx.clothingUnlockTags ?? [];
    if (!unlockTags.includes(condition.clothingTagRequired)) return { pass: false };
  }
  if (condition.clothingTagForbidden !== undefined) {
    const lockTags = ctx.clothingLockTags ?? [];
    if (lockTags.includes(condition.clothingTagForbidden)) return { pass: false };
  }

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
    const resolved = resolveSkillCheckWithPoemFlags(skill, difficulty, ctx.skills, ctx.flags);
    return {
      pass: resolved.success,
      skillCheckResult: { skill, difficulty, ...resolved },
      consumedFlag: resolved.consumedFlag,
    };
  }

  return { pass: true };
}
