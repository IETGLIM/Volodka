
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

/* ─── Quest indicator helpers for NPC quest markers ─── */

export type QuestIndicatorType = 'available' | 'active' | 'completed';

/**
 * Get the quest indicator type for a specific NPC.
 *
 * Priority order (highest wins):
 * 1. 'available' — NPC has a quest that can be taken (not yet in quest state,
 *    dependencies met, required flags set)
 * 2. 'active' — NPC has an in-progress quest with incomplete objectives
 * 3. 'completed' — NPC has a recently completed quest (last quest giver)
 *
 * Returns null if the NPC has no quest association.
 *
 * Karma thresholds for quest availability (documented here for reference):
 *   - Some quests may require karma >= 40 (neutral+) to unlock moral choices
 *   - Dark path quests may require karma <= 30 (Тьма alignment)
 *   - Most side quests have no karma gate
 *   - Main questline is karma-independent until Act 3 choices
 */
export function getQuestIndicatorForNpc(npcId: string): QuestIndicatorType | null {
  const { quests } = getGameStore();

  let hasAvailable = false;
  let hasActive = false;
  let hasCompleted = false;

  for (const def of QUEST_DEFINITIONS) {
    // Only consider quests where this NPC is the quest giver
    if (def.questGiverNpcId !== npcId) continue;

    // Check quest state
    const questState = quests.find((q) => q.questId === def.id);

    if (!questState || questState.status === 'inactive') {
      // Quest not yet taken — check if available (dependencies met)
      const deps = areDependenciesMet(def.id);
      // Check required flag
      const flagMet = !def.requiredFlag || getGameStore().playerState.flags[def.requiredFlag] === true;
      if (deps.met && flagMet) {
        hasAvailable = true;
      }
    } else if (questState.status === 'active') {
      // Quest is active — check if it has incomplete objectives
      const hasIncomplete = Object.values(questState.objectives).some((v) => !v);
      if (hasIncomplete) {
        hasActive = true;
      }
    } else if (questState.status === 'completed') {
      hasCompleted = true;
    }
  }

  // Priority: available > active > completed
  if (hasAvailable) return 'available';
  if (hasActive) return 'active';
  if (hasCompleted) return 'completed';
  return null;
}

/**
 * React hook: get the quest indicator type for a specific NPC.
 * Re-renders when quest state changes.
 */
export function useQuestIndicatorForNpc(npcId: string): QuestIndicatorType | null {
  const quests = useGameStore(
    useShallow((state) => state.quests),
  );

  // Use the same logic as getQuestIndicatorForNpc but via hook for reactivity
  let hasAvailable = false;
  let hasActive = false;
  let hasCompleted = false;

  for (const def of QUEST_DEFINITIONS) {
    if (def.questGiverNpcId !== npcId) continue;

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
