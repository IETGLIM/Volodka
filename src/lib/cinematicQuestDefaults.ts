import type { ExtendedQuest } from '@/data/types';

/** Дефолтные id из `animeCutscenes.ts` — подставляются, если в квесте нет `cutsceneOn*`. */
export const CINEMATIC_BEAT = {
  questStart: 'cinematic_beat_quest_start',
  questMilestone: 'cinematic_beat_quest_milestone',
  questComplete: 'cinematic_beat_quest_complete',
  storyChoice: 'cinematic_beat_story_turn',
  poemCollected: 'cinematic_beat_poem_collected',
  achievement: 'cinematic_beat_achievement',
} as const;

export function resolveQuestStartCutsceneId(def: ExtendedQuest | undefined): string | null {
  if (!def) return CINEMATIC_BEAT.questStart;
  return def.cutsceneOnStart ?? CINEMATIC_BEAT.questStart;
}

export function resolveQuestCompleteCutsceneId(def: ExtendedQuest | undefined): string | null {
  if (!def) return CINEMATIC_BEAT.questComplete;
  return def.cutsceneOnComplete ?? CINEMATIC_BEAT.questComplete;
}

export function resolveQuestObjectiveCutsceneId(
  def: ExtendedQuest | undefined,
  objectiveId: string,
): string | null {
  if (!def) return CINEMATIC_BEAT.questMilestone;
  return def.cutsceneOnObjective?.[objectiveId] ?? CINEMATIC_BEAT.questMilestone;
}
