// ============================================
// useQuestProgress — Автоматическое обновление квестов
// ============================================

import { useCallback, useEffect, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from '@/state';
import { QUEST_DEFINITIONS, isObjectiveSatisfied } from '../data/quests';
import { getFactionByNPC, type FactionId } from '../data/factions';
import type { SceneId } from '../data/types';
import { dispatchQuestEvent, runQuestCompletionScan } from '@/game/core/questEvents';
import { useQuestState } from '@/hooks/useQuestState';
import { useQuestActions } from '@/hooks/useQuestActions';

export type { QuestEvent, QuestEventType } from '@/game/core/questTypes';

// ============================================
// Временный фасад фракций (до выноса в отдельный хук / Этап 2.3)
// ============================================

function useFactionActions() {
  const updateFactionReputation = useCallback((factionId: FactionId, change: number) => {
    useGameStore.getState().updateFactionReputation(factionId, change);
  }, []);
  return { updateFactionReputation };
}

// ============================================
// HOOK
// ============================================

export function useQuestProgress() {
  const { activeQuestIds, completedQuestIds, questProgress } = useQuestState();
  const { activateQuest: activateQuestAction } = useQuestActions();
  const { updateFactionReputation } = useFactionActions();

  const activeQuestsWithProgress = useMemo(() => {
    return activeQuestIds
      .map((id) => {
        const def = QUEST_DEFINITIONS[id];
        if (!def) return null;

        const progress = questProgress[id] || {};

        const objectives = def.objectives.map((obj) => {
          const cur = progress[obj.id] ?? obj.currentValue ?? 0;
          return {
            ...obj,
            currentValue: cur,
            completed: isObjectiveSatisfied(obj, cur),
          };
        });

        const allCompleted = objectives.every((o) => o.completed);

        return {
          ...def,
          objectives,
          progressPercent: (objectives.filter((o) => o.completed).length / objectives.length) * 100,
          isCompletable: allCompleted && !completedQuestIds.includes(id),
        };
      })
      .filter(Boolean);
  }, [activeQuestIds, questProgress, completedQuestIds]);

  useEffect(() => {
    runQuestCompletionScan();
  }, [questProgress]);

  const handleNPCInteraction = useCallback(
    (npcId: string, relationChange: number = 1) => {
      const factionId = getFactionByNPC(npcId);
      if (factionId) {
        updateFactionReputation(factionId, relationChange);
      }

      dispatchQuestEvent({
        type: 'npc_talked',
        data: { npcId },
      });
    },
    [updateFactionReputation]
  );

  const handleLocationVisit = useCallback((locationId: SceneId) => {
    dispatchQuestEvent({
      type: 'location_visited',
      data: { locationId },
    });
  }, []);

  const handlePoemCollected = useCallback((poemId: string) => {
    dispatchQuestEvent({
      type: 'poem_collected',
      data: { poemId },
    });
  }, []);

  const handleTerminalUsed = useCallback((command?: string) => {
    dispatchQuestEvent({
      type: 'terminal_used',
      data: { command },
    });
  }, []);

  const activateQuestById = useCallback(
    (questId: string) => {
      if (!activeQuestIds.includes(questId) && !completedQuestIds.includes(questId)) {
        activateQuestAction(questId);
      }
    },
    [activeQuestIds, completedQuestIds, activateQuestAction]
  );

  return {
    activeQuests: activeQuestsWithProgress,
    completedQuestIds,
    handleEvent: dispatchQuestEvent,
    handleNPCInteraction,
    handleLocationVisit,
    handlePoemCollected,
    handleTerminalUsed,
    activateQuest: activateQuestById,
    checkQuestCompletion: runQuestCompletionScan,
  };
}

// ============================================
// SELECTOR HOOKS
// ============================================

/** Срез квестов из фасада; экшены квестов — `useQuestActions`. */
export const useQuests = () => useQuestState();

/** Репутация фракций пока из `gameStore`; обновление — через временный `useFactionActions` (до Этапа 2.3). */
export const useFactions = () => {
  const { updateFactionReputation } = useFactionActions();
  const { factionReputations, getFactionReputation } = useGameStore(
    useShallow((s) => ({
      factionReputations: s.factionReputations,
      getFactionReputation: s.getFactionReputation,
    }))
  );
  return { factionReputations, updateFactionReputation, getFactionReputation };
};

export default useQuestProgress;

/**
 * Подписка на мир: посещение локации для квестов + базовый прогресс.
 * Вызывать из `useGameScene` с текущей сценой; ядро (`initGameCore`) обрабатывает обход отдельно.
 */
export function useQuestProgressBridge(currentSceneId: SceneId) {
  const api = useQuestProgress();

  useEffect(() => {
    api.handleLocationVisit(currentSceneId);
  }, [currentSceneId, api.handleLocationVisit]);

  return api;
}
