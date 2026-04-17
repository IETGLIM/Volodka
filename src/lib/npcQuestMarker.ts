import {
  QUEST_DEFINITIONS,
  checkQuestAvailability,
  getNextTrackedObjective,
} from '@/data/quests';

export type NpcQuestMarkerVisual = 'none' | 'available' | 'in_progress' | 'turn_in';

function resolveTurnInNpcId(quest: (typeof QUEST_DEFINITIONS)[string]): string | null {
  const vis = quest.objectives.filter((o) => !o.hidden);
  for (let i = vis.length - 1; i >= 0; i--) {
    if (vis[i].targetNPC) return vis[i].targetNPC;
  }
  return null;
}

/**
 * Индикатор квеста над NPC для 3D: приоритет сдача → прогресс → новый квест.
 */
export function getNpcQuestMarkerForExploration(
  npcId: string,
  slice: {
    activeQuestIds: string[];
    completedQuestIds: string[];
    questProgress: Record<string, Record<string, number>>;
    flags: Record<string, boolean>;
  },
): NpcQuestMarkerVisual {
  const { activeQuestIds, completedQuestIds, questProgress, flags } = slice;

  for (const qid of activeQuestIds) {
    const quest = QUEST_DEFINITIONS[qid];
    if (!quest) continue;
    const prog = questProgress[qid] || {};
    const next = getNextTrackedObjective(quest, prog);
    if (next !== null) continue;
    const turnInId = resolveTurnInNpcId(quest);
    if (turnInId === npcId) return 'turn_in';
  }

  for (const qid of activeQuestIds) {
    const quest = QUEST_DEFINITIONS[qid];
    if (!quest) continue;
    const prog = questProgress[qid] || {};
    const next = getNextTrackedObjective(quest, prog);
    if (next?.targetNPC === npcId) return 'in_progress';
  }

  for (const quest of Object.values(QUEST_DEFINITIONS)) {
    const qid = quest.id;
    if (activeQuestIds.includes(qid) || completedQuestIds.includes(qid)) continue;
    if (!checkQuestAvailability(quest, completedQuestIds, flags)) continue;
    const starter = quest.objectives.find((o) => !o.hidden && o.targetNPC);
    if (starter?.targetNPC === npcId) return 'available';
  }

  return 'none';
}
