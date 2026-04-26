import type { SceneId, ExtendedQuest } from '@/data/types';
import { QUEST_DEFINITIONS, getNextTrackedObjective } from '@/data/quests';

export type ExplorationSceneObjectiveLine = {
  questId: string;
  questTitle: string;
  objectiveId: string;
  objectiveText: string;
  hint?: string;
};

function questSortRank(quest: ExtendedQuest): number {
  return quest.type === 'main' ? 0 : 1;
}

/**
 * Активные шаги квестов 📋 для указанной 3D-локации.
 * Отбор «текущего шага» совпадает с метками миникарты (`GameOrchestrator` / `MiniMap`).
 */
export function getExplorationSceneObjectiveLines(
  activeQuestIds: readonly string[],
  questProgress: Record<string, Record<string, number>>,
  sceneId: SceneId,
): ExplorationSceneObjectiveLine[] {
  type Row = ExplorationSceneObjectiveLine & { _rank: number };
  const rows: Row[] = [];

  for (const qid of activeQuestIds) {
    const quest = QUEST_DEFINITIONS[qid];
    if (!quest) continue;
    const prog = questProgress[qid] || {};
    const next = getNextTrackedObjective(quest, prog);
    const obj = next ?? quest.objectives.find((o) => !o.hidden);
    if (!obj?.targetLocation || obj.targetLocation !== sceneId) continue;

    rows.push({
      questId: qid,
      questTitle: quest.title,
      objectiveId: obj.id,
      objectiveText: obj.text,
      hint: obj.hint,
      _rank: questSortRank(quest),
    });
  }

  rows.sort((a, b) => a._rank - b._rank || a.questId.localeCompare(b.questId));

  return rows.map(({ _rank, ...line }) => line);
}
