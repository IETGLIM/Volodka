'use client';

import { useCallback } from 'react';
import { useGameStore } from '@/state';

/**
 * Фасад над действиями с квестами.
 * Пока делегирует в gameStore, после распила — напрямую в questStore.
 */
export function useQuestActions() {
  const activateQuest = useCallback((questId: string) => {
    useGameStore.getState().activateQuest(questId);
  }, []);

  const completeQuest = useCallback((questId: string) => {
    useGameStore.getState().completeQuest(questId);
  }, []);

  const updateQuestObjective = useCallback(
    (questId: string, objectiveId: string, value?: number) => {
      useGameStore.getState().updateQuestObjective(questId, objectiveId, value);
    },
    []
  );

  const incrementQuestObjective = useCallback(
    (questId: string, objectiveId: string) => {
      useGameStore.getState().incrementQuestObjective(questId, objectiveId);
    },
    []
  );

  return {
    activateQuest,
    completeQuest,
    updateQuestObjective,
    incrementQuestObjective,
  };
}
