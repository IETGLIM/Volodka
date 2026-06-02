
/* ─── Volodka RPG – derived quest store for UI (AAA+ Overhaul) ─── */

import type { QuestState, QuestType, SceneId } from '@/shared/types/game';
import { useGameStore, getGameStore } from './gameStore';
import { useShallow } from 'zustand/react/shallow';
import { QUEST_DEFINITIONS } from '@/data/quests';
import { getSceneConfig } from '@/config/scenes';

/* ─── Selectors ─── */

/** Get all quests with status 'active' */
export function getActiveQuests(): QuestState[] {
  const { quests } = getGameStore();
  return quests.filter((q) => q.status === 'active');
}

/** Get all quests with status 'failed' */
export function getFailedQuests(): QuestState[] {
  const { quests } = getGameStore();
  return quests.filter((q) => q.status === 'failed');
}

/** Get quests grouped by quest type */
export function getQuestsByType(): Record<QuestType, QuestState[]> {
  const { quests } = getGameStore();
  const groups: Record<QuestType, QuestState[]> = {
    main: [],
    side: [],
    hidden: [],
    daily: [],
  };

  for (const qs of quests) {
    if (qs.status !== 'active') continue;
    const def = QUEST_DEFINITIONS.find((d) => d.id === qs.questId);
    if (def) {
      groups[def.questType].push(qs);
    }
  }

  return groups;
}

/** Get quest progress as a percentage */
export function getQuestProgress(questId: string): number {
  const { quests } = getGameStore();
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

/** Check if a quest's dependencies are met */
export function areDependenciesMet(questId: string): { met: boolean; missing: string[] } {
  const definition = QUEST_DEFINITIONS.find((d) => d.id === questId);
  if (!definition?.requiresQuests || definition.requiresQuests.length === 0) {
    return { met: true, missing: [] };
  }

  const { quests } = getGameStore();
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

/**
 * Get the map marker for a quest — returns the scene and spawn position
 * of the quest's linked story node, or null if not resolvable.
 */
export function getQuestMarker(
  questId: string,
): { sceneId: SceneId; position: [number, number, number] } | null {
  const definition = QUEST_DEFINITIONS.find((d) => d.id === questId);
  if (!definition?.linkedStoryNodeId) return null;

  // Find the first uncompleted objective target as a heuristic,
  // or fall back to the quest's linked node's scene.

  const { quests } = getGameStore();
  const questState = quests.find((q) => q.questId === questId);
  if (!questState || questState.status !== 'active') return null;

  for (const objDef of definition.objectives) {
    if (questState.objectives[objDef.id]) continue; // already completed

    if (objDef.type === 'location_visited' && objDef.target) {
      const sceneId = objDef.target as SceneId;
      const config = getSceneConfig(sceneId);
      return {
        sceneId: config.id,
        position: config.spawnPoint,
      };
    }
  }

  // Fallback: try to find any objective target that maps to a scene
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

/**
 * Get the next (first uncompleted) tracked objective for a quest.
 */
export function getNextTrackedObjective(
  questId: string,
): { objectiveId: string; description: string; poemPowerHint?: string } | null {
  const { quests } = getGameStore();
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

  return null; // all objectives completed
}

/* ─── React hook wrappers ─── */

/** Hook: get active quests, re-renders on quest changes */
export function useActiveQuests(): QuestState[] {
  return useGameStore(
    useShallow((state) =>
      state.quests.filter((q) => q.status === 'active'),
    ),
  );
}

/** Hook: get failed quests, re-renders on quest changes */
export function useFailedQuests(): QuestState[] {
  return useGameStore(
    useShallow((state) =>
      state.quests.filter((q) => q.status === 'failed'),
    ),
  );
}

/** Hook: get the next tracked objective for a given quest */
export function useNextTrackedObjective(
  questId: string,
): { objectiveId: string; description: string; poemPowerHint?: string } | null {
  const questState = useGameStore((state) =>
    state.quests.find((q) => q.questId === questId),
  );
  const definition = QUEST_DEFINITIONS.find((d) => d.id === questId);

  if (!questState || questState.status !== 'active' || !definition) return null;

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
