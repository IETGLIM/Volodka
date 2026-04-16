/**
 * Валидация JSON квестов от LLM перед записью в стор.
 * Схема соответствует ExtendedQuest из @/data/types (без строгой проверки discoveryCondition).
 */

import { z } from 'zod';
import type { ExtendedQuest } from '@/data/types';
import { QUEST_DEFINITIONS } from '@/data/quests';

const statKey = z.enum([
  'mood',
  'creativity',
  'stability',
  'energy',
  'karma',
  'writing',
  'perception',
  'empathy',
  'persuasion',
  'intuition',
  'resilience',
  'introspection',
]);

const choiceConditionInner = z
  .object({
    stat: statKey.optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    hasFlag: z.string().optional(),
    notFlag: z.string().optional(),
    hasItem: z.string().optional(),
    minRelation: z
      .object({
        npcId: z.string(),
        value: z.number(),
      })
      .optional(),
    visitedNode: z.string().optional(),
    questActive: z.string().optional(),
    questCompleted: z.string().optional(),
    questNotStarted: z.string().optional(),
    questNotCompleted: z.string().optional(),
    minQuestCount: z.number().optional(),
  })
  .strict();

const discoveryConditionSchema = z.union([choiceConditionInner, z.null()]).optional();

const questObjectiveSchema = z
  .object({
    id: z.string().min(1),
    text: z.string(),
    completed: z.boolean().optional().default(false),
    targetValue: z.number().optional(),
    currentValue: z.number().optional().default(0),
    hidden: z.boolean().optional().default(false),
    hint: z.string().optional(),
    targetLocation: z.string().optional(),
    targetNPC: z.string().optional(),
    targetItem: z.string().optional(),
    stageType: z
      .enum(['minigame', 'narration', 'exploration', 'dialogue', 'terminal'])
      .optional(),
    linkedStoryNodeId: z.string().optional(),
  })
  .strict();

const questRewardSchema = z
  .object({
    creativity: z.number().optional(),
    mood: z.number().optional(),
    stability: z.number().optional(),
    karma: z.number().optional(),
    skillPoints: z.number().optional(),
    itemRewards: z.array(z.string()).optional(),
    unlockFlags: z.array(z.string()).optional(),
    perception: z.number().optional(),
    introspection: z.number().optional(),
    writing: z.number().optional(),
    empathy: z.number().optional(),
    persuasion: z.number().optional(),
    intuition: z.number().optional(),
    resilience: z.number().optional(),
  })
  .strict();

export const extendedQuestFromAISchema = z
  .object({
    id: z.string().min(1),
    title: z.string(),
    description: z.string(),
    type: z.enum(['main', 'side', 'hidden', 'personal']),
    status: z.enum(['locked', 'available', 'active', 'completed', 'failed']),
    objectives: z.array(questObjectiveSchema).min(1),
    reward: questRewardSchema,
    prerequisite: z.string().optional(),
    requiredFlags: z.array(z.string()).optional(),
    timeLimit: z.number().optional(),
    startNode: z.string().optional(),
    completeNode: z.string().optional(),
    discoveryCondition: discoveryConditionSchema,
    startTime: z.number().optional(),
    completedTime: z.number().optional(),
    hidden: z.boolean().optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (QUEST_DEFINITIONS[data.id]) {
      ctx.addIssue({
        code: 'custom',
        message: `Quest id "${data.id}" is reserved by built-in QUEST_DEFINITIONS`,
        path: ['id'],
      });
    }
  });

export type AIQuestParseResult =
  | { success: true; quest: ExtendedQuest }
  | { success: false; error: string };

/** Разбор и нормализация ответа модели; не пишет в стор. */
export function parseAIQuestPayload(payload: unknown): AIQuestParseResult {
  const parsed = extendedQuestFromAISchema.safeParse(payload);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
    };
  }
  const q = parsed.data;
  const quest: ExtendedQuest = {
    id: q.id,
    title: q.title,
    description: q.description,
    type: q.type,
    status: q.status,
    objectives: q.objectives.map((o) => ({
      id: o.id,
      text: o.text,
      completed: o.completed,
      targetValue: o.targetValue,
      currentValue: o.currentValue,
      hidden: o.hidden,
      hint: o.hint,
      targetLocation: o.targetLocation,
      targetNPC: o.targetNPC,
      targetItem: o.targetItem,
      stageType: o.stageType,
      linkedStoryNodeId: o.linkedStoryNodeId,
    })),
    reward: {
      ...q.reward,
      itemRewards: q.reward.itemRewards ?? [],
      unlockFlags: q.reward.unlockFlags ?? [],
    },
    prerequisite: q.prerequisite,
    requiredFlags: q.requiredFlags,
    timeLimit: q.timeLimit,
    startNode: q.startNode,
    completeNode: q.completeNode,
    discoveryCondition: q.discoveryCondition === null ? undefined : q.discoveryCondition,
    startTime: q.startTime,
    completedTime: q.completedTime,
    hidden: q.hidden,
  };
  return { success: true, quest };
}
