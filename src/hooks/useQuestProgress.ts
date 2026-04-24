// ============================================
// useQuestProgress — Автоматическое обновление квестов
// ============================================

import { useCallback, useEffect, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from '../store/gameStore';
import { QUEST_DEFINITIONS, isObjectiveSatisfied } from '../data/quests';
import { getFactionByNPC } from '../data/factions';
import type { SceneId } from '../data/types';
import { dispatchQuestEvent, runQuestCompletionScan } from '@/game/core/questEvents';

export type { QuestEvent, QuestEventType } from '@/game/core/questTypes';

// ============================================
// HOOK
// ============================================

export function useQuestProgress() {
  const activeQuestIds = useGameStore((s) => s.activeQuestIds);
  const completedQuestIds = useGameStore((s) => s.completedQuestIds);
  const questProgress = useGameStore((s) => s.questProgress);
  const activateQuest = useGameStore((s) => s.activateQuest);
  const updateFactionReputation = useGameStore((s) => s.updateFactionReputation);

  // Активные квесты с прогрессом
  const activeQuestsWithProgress = useMemo(() => {
    return activeQuestIds
      .map((id) => {
        const def = QUEST_DEFINITIONS[id];
        if (!def) return null;
        
        const progress = questProgress[id] || {};
        
        // Обновляем objectives с текущим прогрессом
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
          progressPercent: objectives.filter((o) => o.completed).length / objectives.length * 100,
          isCompletable: allCompleted && !completedQuestIds.includes(id),
        };
      })
      .filter(Boolean);
  }, [activeQuestIds, questProgress, completedQuestIds]);

  // Автоматическая проверка завершения при изменении прогресса (терминал, диалог и т.д.)
  useEffect(() => {
    runQuestCompletionScan();
  }, [questProgress]);

  // Разговор с NPC — обновляем репутацию фракции
  const handleNPCInteraction = useCallback((npcId: string, relationChange: number = 1) => {
    const factionId = getFactionByNPC(npcId);
    if (factionId) {
      updateFactionReputation(factionId, relationChange);
    }
    
    dispatchQuestEvent({
      type: 'npc_talked',
      data: { npcId },
    });
  }, [updateFactionReputation]);

  // Посещение локации
  const handleLocationVisit = useCallback((locationId: SceneId) => {
    dispatchQuestEvent({
      type: 'location_visited',
      data: { locationId },
    });
  }, []);

  // Сбор стихотворения
  const handlePoemCollected = useCallback((poemId: string) => {
    dispatchQuestEvent({
      type: 'poem_collected',
      data: { poemId },
    });
  }, []);

  // Использование терминала
  const handleTerminalUsed = useCallback((command?: string) => {
    dispatchQuestEvent({
      type: 'terminal_used',
      data: { command },
    });
  }, []);

  // Активировать квест
  const activateQuestById = useCallback((questId: string) => {
    if (!activeQuestIds.includes(questId) && !completedQuestIds.includes(questId)) {
      activateQuest(questId);
    }
  }, [activeQuestIds, completedQuestIds, activateQuest]);

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

export const useQuests = () => useGameStore(useShallow((s) => ({
  activeQuestIds: s.activeQuestIds,
  completedQuestIds: s.completedQuestIds,
  questProgress: s.questProgress,
  activateQuest: s.activateQuest,
  completeQuest: s.completeQuest,
  updateQuestObjective: s.updateQuestObjective,
  incrementQuestObjective: s.incrementQuestObjective,
})));

export const useFactions = () => useGameStore(useShallow((s) => ({
  factionReputations: s.factionReputations,
  updateFactionReputation: s.updateFactionReputation,
  getFactionReputation: s.getFactionReputation,
})));

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
