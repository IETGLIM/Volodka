/* ─── Volodka RPG – quest derived selectors ─── */

import { useMemo } from 'react';
import type { QuestState, QuestType, SceneId } from '@/shared/types/game';
import { getQuestDefinitions } from '@/data/gameDataLoader';
import { resolveCanonicalNpcId, GOLDEN_PATH_QUEST_SPINE } from '@/data/goldenPath';
import { getObjectiveNpcHint, getObjectiveSceneHint } from '@/data/questNpcMarkers';
import { getSceneConfig } from '@/config/scenes';
import { getGameStore } from '../gameStore';
import { memoizeBySourceRef, createSourceRefCache } from './memo';
import { useGameSelector } from './hooks';
import { selectQuests } from './worldSelectors';
import { areQuestDependenciesMet } from '@/shared/quest/questDependencies';
import { canStartQuestFromEngine } from '../storeEngineHost';

/* ─── Memo caches for imperative getters ─── */

const activeQuestsCache = createSourceRefCache<QuestState[], QuestState[]>();
const failedQuestsCache = createSourceRefCache<QuestState[], QuestState[]>();
const questsByTypeCache = createSourceRefCache<QuestState[], Record<QuestType, QuestState[]>>();

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
      const def = getQuestDefinitions().find((d) => d.id === qs.questId);
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

  const definition = getQuestDefinitions().find((d) => d.id === questId);
  if (!definition) return 0;

  const total = definition.objectives.length;
  if (total === 0) return 0;

  const completed = definition.objectives.filter(
    (obj) => quest.objectives[obj.id] === true,
  ).length;

  return Math.round((completed / total) * 100);
}

export function areDependenciesMet(questId: string): { met: boolean; missing: string[] } {
  const quests = selectQuests();
  return areQuestDependenciesMet(questId, quests, (id) => getQuestDefinitions().find((d) => d.id === id));
}

export function getQuestMarker(
  questId: string,
): { sceneId: SceneId; position: [number, number, number] } | null {
  const definition = getQuestDefinitions().find((d) => d.id === questId);
  if (!definition?.linkedStoryNodeId) return null;

  const quests = selectQuests();
  const questState = quests.find((q) => q.questId === questId);
  if (!questState || questState.status !== 'active') return null;

  for (const objDef of definition.objectives) {
    if (questState.objectives[objDef.id]) continue;

    const sceneHint = getObjectiveSceneHint(questId, objDef.id);
    if (sceneHint) {
      return sceneHint;
    }

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

  const definition = getQuestDefinitions().find((d) => d.id === questId);
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

export type NpcQuestMarkerType = 'available' | 'active' | 'complete';

export interface NpcQuestMarkerDisplay {
  icon: '!' | '?' | '✓';
  color: string;
  glowPrefix: string;
  pulseSpeed: number;
  questName: string;
  type: NpcQuestMarkerType;
}

function isNpcRelevantToQuest(questId: string, npcId: string): boolean {
  const def = getQuestDefinitions().find((d) => d.id === questId);
  if (!def) return false;
  const canonical = resolveCanonicalNpcId(npcId);
  if (def.questGiverNpcId === canonical) return true;
  if (def.objectives.some((o) => o.type === 'npc_talked' && o.target === canonical)) return true;
  return def.objectives.some((o) => getObjectiveNpcHint(questId, o.id) === canonical);
}

function npcMatchesObjective(questId: string, objectiveId: string, npcId: string): boolean {
  const canonical = resolveCanonicalNpcId(npcId);
  const hint = getObjectiveNpcHint(questId, objectiveId);
  if (hint) return resolveCanonicalNpcId(hint) === canonical;
  const def = getQuestDefinitions().find((d) => d.id === questId);
  const obj = def?.objectives.find((o) => o.id === objectiveId);
  return obj?.type === 'npc_talked' && resolveCanonicalNpcId(obj.target ?? '') === canonical;
}

/** Floating !/?/✓ above an NPC — shared by NPC.tsx QuestMarker. */
export function getNpcQuestMarkerDisplay(npcId: string): NpcQuestMarkerDisplay | null {
  const quests = selectQuests();
  const canonicalNpcId = resolveCanonicalNpcId(npcId);

  for (const q of quests) {
    if (q.status !== 'active') continue;
    if (!Object.values(q.objectives).every((v) => v)) continue;
    const questDef = getQuestDefinitions().find((d) => d.id === q.questId);
    if (!questDef || !isNpcRelevantToQuest(q.questId, canonicalNpcId)) continue;
    return {
      icon: '✓',
      color: '#00ff66',
      glowPrefix: 'rgba(0, 255, 102,',
      pulseSpeed: 0.7,
      questName: questDef.title,
      type: 'complete',
    };
  }

  for (const q of quests) {
    if (q.status !== 'active') continue;
    if (!Object.values(q.objectives).some((v) => !v)) continue;
    const questDef = getQuestDefinitions().find((d) => d.id === q.questId);
    if (!questDef) continue;

    for (const obj of questDef.objectives) {
      if (q.objectives[obj.id]) continue;
      if (npcMatchesObjective(q.questId, obj.id, canonicalNpcId)) {
        return {
          icon: '?',
          color: '#66ccff',
          glowPrefix: 'rgba(102, 204, 255,',
          pulseSpeed: 1.0,
          questName: questDef.title,
          type: 'active',
        };
      }
    }

    if (isNpcRelevantToQuest(q.questId, canonicalNpcId)) {
      return {
        icon: '?',
        color: '#66ccff',
        glowPrefix: 'rgba(102, 204, 255,',
        pulseSpeed: 1.0,
        questName: questDef.title,
        type: 'active',
      };
    }
  }

  for (const qDef of getQuestDefinitions()) {
    if (!isNpcRelevantToQuest(qDef.id, canonicalNpcId)) continue;
    const existing = quests.find((q) => q.questId === qDef.id);
    if (existing && existing.status !== 'inactive') continue;
    if (!canStartQuestFromEngine(qDef.id)) continue;

    const isGoldenPath = GOLDEN_PATH_QUEST_SPINE.includes(qDef.id);
    if (!isGoldenPath && qDef.questType !== 'main' && qDef.questType !== 'side') continue;

    return {
      icon: '!',
      color: '#ffdd00',
      glowPrefix: 'rgba(255, 221, 0,',
      pulseSpeed: 1.5,
      questName: qDef.title,
      type: 'available',
    };
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

  for (const def of getQuestDefinitions()) {
    if (!isNpcRelevantToQuest(def.id, canonicalNpcId)) continue;

    const questState = quests.find((q) => q.questId === def.id);

    if (!questState || questState.status === 'inactive') {
      const deps = areDependenciesMet(def.id);
      const flagMet = !def.requiredFlag || getGameStore().playerState.flags[def.requiredFlag] === true;
      const poemMet = !def.requiredPoem || getGameStore().collectedPoems.includes(def.requiredPoem);
      if (deps.met && flagMet && poemMet) {
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
  const quests = useGameSelector((state) => state.quests);
  return useMemo(
    () => quests.filter((q) => q.status === 'active'),
    [quests],
  );
}

export function useFailedQuests(): QuestState[] {
  const quests = useGameSelector((state) => state.quests);
  return useMemo(
    () => quests.filter((q) => q.status === 'failed'),
    [quests],
  );
}

export function useNextTrackedObjective(
  questId: string,
): { objectiveId: string; description: string; poemPowerHint?: string } | null {
  return useGameSelector((state) => {
    const questState = state.quests.find((q) => q.questId === questId);
    if (!questState || questState.status !== 'active') return null;

    const definition = getQuestDefinitions().find((d) => d.id === questId);
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

  for (const def of getQuestDefinitions()) {
    if (!isNpcRelevantToQuest(def.id, canonicalNpcId)) continue;

    const questState = quests.find((q) => q.questId === def.id);

    if (!questState || questState.status === 'inactive') {
      const deps = areDependenciesMet(def.id);
      const flagMet = !def.requiredFlag || getGameStore().playerState.flags[def.requiredFlag] === true;
      const poemMet = !def.requiredPoem || getGameStore().collectedPoems.includes(def.requiredPoem);
      if (deps.met && flagMet && poemMet) {
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
