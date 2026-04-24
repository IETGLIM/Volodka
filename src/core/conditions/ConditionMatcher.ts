/**
 * Единая проверка условий для диалогов, последствий, выборов сюжета и объектов обхода.
 * Расширения: время суток (`minTimeOfDay` / `maxTimeOfDay`), экипировка (`equippedAnyOf`).
 */
import type { DialogueCondition } from '@/data/rpgTypes';
import type {
  ChoiceCondition,
  NarrativeTimeOfDay,
  NPCRelation,
  PlayerSkills,
  PlayerState,
} from '@/data/types';
import type { ConsequenceCondition, ConsequenceEvaluationContext } from '@/engine/ConsequencesSystem';
import { explorationHourToNarrativeTimeOfDay, narrativeTimeInRange } from '@/core/conditions/timeOfDay';

export type { NarrativeTimeOfDay } from '@/data/types';
export { explorationHourToNarrativeTimeOfDay } from '@/core/conditions/timeOfDay';

/** Общий контекст: стор + опционально фаза суток и экипировка. */
export interface ConditionMatchContext {
  playerState: PlayerState;
  npcRelations: NPCRelation[];
  flags: Record<string, boolean>;
  inventory: string[];
  visitedNodes: string[];
  skills: PlayerSkills;
  activeQuestIds: string[];
  completedQuestIds: string[];
  /** Фаза суток (из часа обхода или сюжета). */
  narrativeTimeOfDay?: NarrativeTimeOfDay;
  /** Id «экипированных» предметов; пустой массив — нет экипировки в данных. */
  equippedItemIds?: string[];
  /** Узлы диалога, уже посещённые у текущего NPC (для `completedDialogue`). */
  dialogueVisitedNodeIds?: string[];
}

export interface ConditionMatchResult {
  met: boolean;
  reason?: string;
}

function equippedSatisfies(required: string[] | undefined, equipped: string[] | undefined): boolean {
  if (!required?.length) return true;
  const have = equipped ?? [];
  return required.some((id) => have.includes(id));
}

function checkTimeAndEquipment(
  c: { minTimeOfDay?: NarrativeTimeOfDay; maxTimeOfDay?: NarrativeTimeOfDay; equippedAnyOf?: string[] },
  ctx: ConditionMatchContext,
): boolean {
  const hasTimeBounds = c.minTimeOfDay !== undefined || c.maxTimeOfDay !== undefined;
  if (hasTimeBounds && !narrativeTimeInRange(ctx.narrativeTimeOfDay, c.minTimeOfDay, c.maxTimeOfDay)) {
    return false;
  }
  if (!equippedSatisfies(c.equippedAnyOf, ctx.equippedItemIds)) return false;
  return true;
}

/** Значение стата или навыка по имени (как в `StatsEngine`). */
export function getConditionStatOrSkillValue(
  stat: string,
  playerState: PlayerState,
  skills: PlayerSkills,
): number {
  if (stat in playerState) {
    return playerState[stat as keyof PlayerState] as number;
  }
  if (stat in skills) {
    return skills[stat as keyof PlayerSkills] as number;
  }
  return 0;
}

/** Требования к навыкам у интерактивных объектов (`requiredSkills`). */
export function matchRequiredSkills(
  reqs: Array<{ skill: string; min: number }> | undefined,
  skills: PlayerSkills,
): { ok: true } | { ok: false; skill: string; have: number; min: number } {
  if (!reqs?.length) return { ok: true };
  for (const r of reqs) {
    const key = r.skill as keyof PlayerSkills;
    const have = typeof skills[key] === 'number' ? (skills[key] as number) : 0;
    if (have < r.min) {
      return { ok: false, skill: r.skill, have, min: r.min };
    }
  }
  return { ok: true };
}

export function matchChoiceCondition(
  condition: ChoiceCondition,
  ctx: ConditionMatchContext,
): ConditionMatchResult {
  if (!checkTimeAndEquipment(condition, ctx)) {
    return { met: false, reason: 'Сейчас не то время или нет нужной экипировки' };
  }

  if (condition.hasFlag && !ctx.flags[condition.hasFlag]) {
    return { met: false, reason: `Требуется: ${condition.hasFlag}` };
  }
  if (condition.notFlag && ctx.flags[condition.notFlag]) {
    return { met: false, reason: `Заблокировано: ${condition.notFlag}` };
  }
  if (condition.hasItem && !ctx.inventory.includes(condition.hasItem)) {
    return { met: false, reason: `Нужен предмет: ${condition.hasItem}` };
  }

  if (condition.stat) {
    const statValue = getConditionStatOrSkillValue(condition.stat, ctx.playerState, ctx.skills);
    if (condition.min !== undefined && statValue < condition.min) {
      return { met: false, reason: `Нужно: ${condition.stat} ≥ ${condition.min}` };
    }
    if (condition.max !== undefined && statValue > condition.max) {
      return { met: false, reason: `Нужно: ${condition.stat} ≤ ${condition.max}` };
    }
  }

  if (condition.minRelation) {
    const npc = ctx.npcRelations.find((r) => r.id === condition.minRelation!.npcId);
    if (!npc || npc.value < condition.minRelation.value) {
      return { met: false, reason: 'Недостаточно отношений с NPC' };
    }
  }

  if (condition.visitedNode && !ctx.visitedNodes.includes(condition.visitedNode)) {
    return { met: false, reason: 'Нужно посетить определённое место' };
  }

  const active = ctx.activeQuestIds;
  const completed = ctx.completedQuestIds;

  if (condition.questActive && !active.includes(condition.questActive)) {
    return { met: false, reason: 'Требуется активный квест' };
  }
  if (condition.questCompleted && !completed.includes(condition.questCompleted)) {
    return { met: false, reason: 'Нужно завершить квест' };
  }
  if (condition.questNotStarted) {
    if (active.includes(condition.questNotStarted) || completed.includes(condition.questNotStarted)) {
      return { met: false, reason: 'Квест уже начат' };
    }
  }
  if (condition.questNotCompleted && completed.includes(condition.questNotCompleted)) {
    return { met: false, reason: 'Другой путь уже выбран' };
  }
  if (condition.minQuestCount && completed.length < condition.minQuestCount) {
    return {
      met: false,
      reason: `Завершите больше квестов (${completed.length}/${condition.minQuestCount})`,
    };
  }

  return { met: true };
}

export function matchDialogueCondition(condition: DialogueCondition, ctx: ConditionMatchContext): boolean {
  const c = condition;
  if (!checkTimeAndEquipment(c, ctx)) return false;

  if (c.hasFlag && !ctx.flags[c.hasFlag]) return false;
  if (c.notFlag && ctx.flags[c.notFlag]) return false;
  if (c.hasItem && !ctx.inventory.includes(c.hasItem)) return false;

  if (c.minRelation) {
    const npc = ctx.npcRelations.find((r) => r.id === c.minRelation!.npcId);
    if (!npc || npc.value < c.minRelation.value) return false;
  }

  if (c.minSkill) {
    const skillValue = ctx.skills[c.minSkill.skill as keyof PlayerSkills];
    if (typeof skillValue !== 'number' || skillValue < c.minSkill.value) return false;
  }

  if (c.minKarma !== undefined && ctx.playerState.karma < c.minKarma) return false;
  if (c.maxKarma !== undefined && ctx.playerState.karma > c.maxKarma) return false;

  if (c.visitedNode && !ctx.visitedNodes.includes(c.visitedNode)) return false;

  if (c.completedDialogue) {
    const nodes = ctx.dialogueVisitedNodeIds;
    if (!nodes?.includes(c.completedDialogue)) return false;
  }

  return true;
}

export function matchConsequenceCondition(condition: ConsequenceCondition, ctx: ConditionMatchContext): boolean {
  const c = condition;
  if (!checkTimeAndEquipment(c, ctx)) return false;

  if (c.hasFlag && !ctx.flags[c.hasFlag]) return false;
  if (c.notFlag && ctx.flags[c.notFlag]) return false;

  if (c.minStat) {
    const val = ctx.playerState[c.minStat.stat];
    if (typeof val === 'number' && val < c.minStat.value) return false;
  }
  if (c.maxStat) {
    const val = ctx.playerState[c.maxStat.stat];
    if (typeof val === 'number' && val > c.maxStat.value) return false;
  }

  if (c.minRelation) {
    const npc = ctx.npcRelations.find((r) => r.id === c.minRelation!.npcId);
    if (!npc || npc.value < c.minRelation.value) return false;
  }

  if (c.questActive && !ctx.activeQuestIds.includes(c.questActive)) return false;
  if (c.questCompleted && !ctx.completedQuestIds.includes(c.questCompleted)) return false;

  if (c.hasItem && !ctx.inventory.includes(c.hasItem)) return false;
  if (c.visitedNode && !ctx.visitedNodes.includes(c.visitedNode)) return false;

  if (c.choiceCondition) {
    const r = matchChoiceCondition(c.choiceCondition, ctx);
    if (!r.met) return false;
  }

  return true;
}

export function consequenceContextToMatchContext(
  state: ConsequenceEvaluationContext,
): ConditionMatchContext {
  return {
    playerState: state.playerState,
    npcRelations: state.npcRelations,
    flags: state.flags,
    inventory: state.inventory,
    visitedNodes: state.visitedNodes,
    skills: state.playerState.skills,
    activeQuestIds: state.activeQuestIds,
    completedQuestIds: state.completedQuestIds,
    narrativeTimeOfDay: state.narrativeTimeOfDay,
    equippedItemIds: state.equippedItemIds,
  };
}

/** Собрать контекст из часа обхода, если в сторе нет готовой фазы. */
export function withNarrativeTimeFromExplorationHour(
  ctx: ConditionMatchContext,
  explorationHour: number,
): ConditionMatchContext {
  return {
    ...ctx,
    narrativeTimeOfDay: explorationHourToNarrativeTimeOfDay(explorationHour),
  };
}
