/* ─── Volodka RPG – quest derived selectors ─── */

import type { QuestState, QuestType, SceneId } from '@/shared/types/game';
import { QUEST_DEFINITIONS } from '@/data/quests';
import { resolveCanonicalNpcId } from '@/data/goldenPath';
import { getSceneConfig } from '@/config/scenes';
import { getGameStore } from '../gameStore';
import { memoizeBySourceRef } from './memo';
import { useGameSelector } from './hooks';
import { selectQuests } from './worldSelectors';

/* ─── Memo caches for imperative getters ─── */

const activeQuestsCache = { source: null as QuestState[] | null, result: null as QuestState[] | null };
const failedQuestsCache = { source: null as QuestState[] | null, result: null as QuestState[] | null };
const questsByTypeCache = { source: null as QuestState[] | null, result: null as Record<QuestType, QuestState[]> | null };

/* ─── Plain getters (memoized by quests array reference) ─── */

export function getActiveQuests(): QuestState[] {
  const quests = selectQuests();
  return memoizeBySourceRef(quests, activeQuestsCache, (q) =>
    q.filter((quest) => quest.status === 'active'),
  );
}

export function getFailedQuests(): QuestState[] {
  const quests = selectQuests();
  return memoizeBySourceRef(quests, failedQuestsCache, (q) =>
    q.filter((quest) => quest.status === 'failed'),
  );
}

export function getQuestsByType(): Record<QuestType, QuestState[]> {
  const quests = selectQuests();
  return memoizeBySourceRef(quests, questsByTypeCache, (q) => {
    const groups: Record<QuestType, QuestState[]> = {
      main: [],
      side: [],
      hidden: [],
      daily: [],
    };

    for (const qs of q) {
      if (qs.status !== 'active') continue;
      const def = QUEST_DEFINITIONS.find((d) => d.id === qs.questId);
      if (def) {
        groups[def.questType].push(qs);
      }
    }

    return groups;
  });
}

export function getQuestProgress(questId: string): number {
  const quests = selectQuests();
  const quest = quests.find((q) => q.questId === questId);
  if (!quest) return 0;

  const definition = QUEST_DEFINITIONS.find((d) => d.id === questId);
  if (!definition) return 0;

  const total = definition.objectives.length;
  if (total === 0) return 0;

  const completed = definition.objectives.filter(
    (obj) => quest.objectives[obj.id] === true,
  ).length;

  return Math.round((completed / total) * 100);
}

export function areDependenciesMet(questId: string): { met: boolean; missing: string[] } {
  const definition = QUEST_DEFINITIONS.find((d) => d.id === questId);
  if (!definition?.requiresQuests || definition.requiresQuests.length === 0) {
    return { met: true, missing: [] };
  }

  const quests = selectQuests();
  const missing: string[] = [];

  for (const reqId of definition.requiresQuests) {
    const reqQuest = quests.find((q) => q.questId === reqId);
    if (!reqQuest || reqQuest.status !== 'completed') {
      const reqDef = QUEST_DEFINITIONS.find((d) => d.id === reqId);
      missing.push(reqDef?.title ?? reqId);
    }
  }

  return { met: missing.length === 0, missing };
}

export function getQuestMarker(
  questId: string,
): { sceneId: SceneId; position: [number, number, number] } | null {
  const definition = QUEST_DEFINITIONS.find((d) => d.id === questId);
  if (!definition?.linkedStoryNodeId) return null;

  const quests = selectQuests();
  const questState = quests.find((q) => q.questId === questId);
  if (!questState || questState.status !== 'active') return null;

  for (const objDef of definition.objectives) {
    if (questState.objectives[objDef.id]) continue;

    if (objDef.type === 'location_visited' && objDef.target) {
      const sceneId = objDef.target as SceneId;
      const config = getSceneConfig(sceneId);
      return {
        sceneId: config.id,
        position: config.spawnPoint,
      };
    }
  }

  for (const objDef of definition.objectives) {
    if (objDef.target) {
      const config = getSceneConfig(objDef.target as SceneId);
      if (config.id === objDef.target) {
        return {
          sceneId: config.id,
          position: config.spawnPoint,
        };
      }
    }
  }

  return null;
}

export function getNextTrackedObjective(
  questId: string,
): { objectiveId: string; description: string; poemPowerHint?: string } | null {
  const quests = selectQuests();
  const questState = quests.find((q) => q.questId === questId);
  if (!questState || questState.status !== 'active') return null;

  const definition = QUEST_DEFINITIONS.find((d) => d.id === questId);
  if (!definition) return null;

  for (const objDef of definition.objectives) {
    if (!questState.objectives[objDef.id]) {
      return {
        objectiveId: objDef.id,
        description: objDef.description,
        poemPowerHint: objDef.poemPowerHint,
      };
    }
  }

  return null;
}

/* ─── Quest indicator helpers ─── */

export type QuestIndicatorType = 'available' | 'active' | 'completed';

export function getQuestIndicatorForNpc(npcId: string): QuestIndicatorType | null {
  const quests = selectQuests();
  const canonicalNpcId = resolveCanonicalNpcId(npcId);

  let hasAvailable = false;
  let hasActive = false;
  let hasCompleted = false;

  for (const def of QUEST_DEFINITIONS) {
    if (def.questGiverNpcId !== canonicalNpcId) continue;

    const questState = quests.find((q) => q.questId === def.id);

    if (!questState || questState.status === 'inactive') {
      const deps = areDependenciesMet(def.id);
      const flagMet = !def.requiredFlag || getGameStore().playerState.flags[def.requiredFlag] === true;
      if (deps.met && flagMet) {
        hasAvailable = true;
      }
    } else if (questState.status === 'active') {
      const hasIncomplete = Object.values(questState.objectives).some((v) => !v);
      if (hasIncomplete) {
        hasActive = true;
      }
    } else if (questState.status === 'completed') {
      hasCompleted = true;
    }
  }

  if (hasAvailable) return 'available';
  if (hasActive) return 'active';
  if (hasCompleted) return 'completed';
  return null;
}

/* ─── React hooks ─── */

export function useActiveQuests(): QuestState[] {
  return useGameSelector((state) =>
    state.quests.filter((q) => q.status === 'active'),
  );
}

export function useFailedQuests(): QuestState[] {
  return useGameSelector((state) =>
    state.quests.filter((q) => q.status === 'failed'),
  );
}

export function useNextTrackedObjective(
  questId: string,
): { objectiveId: string; description: string; poemPowerHint?: string } | null {
  return useGameSelector((state) => {
    const questState = state.quests.find((q) => q.questId === questId);
    if (!questState || questState.status !== 'active') return null;

    const definition = QUEST_DEFINITIONS.find((d) => d.id === questId);
    if (!definition) return null;

    for (const objDef of definition.objectives) {
      if (!questState.objectives[objDef.id]) {
        return {
          objectiveId: objDef.id,
          description: objDef.description,
          poemPowerHint: objDef.poemPowerHint,
        };
      }
    }

    return null;
  });
}

export function useQuestIndicatorForNpc(npcId: string): QuestIndicatorType | null {
  const quests = useGameSelector((state) => state.quests);
  const canonicalNpcId = resolveCanonicalNpcId(npcId);

  let hasAvailable = false;
  let hasActive = false;
  let hasCompleted = false;

  for (const def of QUEST_DEFINITIONS) {
    if (def.questGiverNpcId !== canonicalNpcId) continue;

    const questState = quests.find((q) => q.questId === def.id);

    if (!questState || questState.status === 'inactive') {
      const deps = areDependenciesMet(def.id);
      const flagMet = !def.requiredFlag || getGameStore().playerState.flags[def.requiredFlag] === true;
      if (deps.met && flagMet) {
        hasAvailable = true;
      }
    } else if (questState.status === 'active') {
      const hasIncomplete = Object.values(questState.objectives).some((v) => !v);
      if (hasIncomplete) {
        hasActive = true;
      }
    } else if (questState.status === 'completed') {
      hasCompleted = true;
    }
  }

  if (hasAvailable) return 'available';
  if (hasActive) return 'active';
  if (hasCompleted) return 'completed';
  return null;
}
