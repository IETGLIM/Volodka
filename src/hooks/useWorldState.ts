'use client';

import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from '@/state';

/**
 * Плоский срез состояния мира (исследование).
 * Пока читает из gameStore; после миграции — напрямую из worldStore.
 */
export function useWorldState() {
  return useGameStore(
    useShallow((s) => {
      const ex = s.exploration;
      return {
        currentSceneId: ex.currentSceneId,
        timeOfDay: ex.timeOfDay,
        npcStates: ex.npcStates,
        triggerStates: ex.triggerStates,
        worldItems: ex.worldItems,
        exploredAreas: ex.exploredAreas,
        playerPosition: ex.playerPosition,
        streaming: ex.streaming,
        gameMode: s.gameMode,
        currentNPCId: s.currentNPCId,
        interactionPrompt: s.interactionPrompt,
        unlockedLocations: s.unlockedLocations,
      };
    })
  );
}
