'use client';

import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from '@/state';

/**
 * Плоский срез состояния квестов.
 * Пока читает из gameStore; после миграции — напрямую из questStore.
 */
export function useQuestState() {
  return useGameStore(
    useShallow((s) => ({
      activeQuestIds: s.activeQuestIds,
      completedQuestIds: s.completedQuestIds,
      questProgress: s.questProgress,
    }))
  );
}
