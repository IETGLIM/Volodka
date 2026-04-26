'use client';

import { useCallback } from 'react';
import { useGameStore } from '@/state';
import type { SceneId } from '@/data/types';
import type { StreamingChunkId } from '@/data/streamingChunkId';

/** Поля `exploration.streaming`, которые зеркалятся из `SceneStreamingCoordinator.getDebugSnapshot()`. */
export type ExplorationStreamingSyncPayload = {
  activeChunkIds: readonly StreamingChunkId[];
  unloadingChunkIds: readonly StreamingChunkId[];
  prefetchQueueLength: number;
  prefetchTargetsPreview: readonly SceneId[];
  budgetTextureBytesApprox: number;
  rapierActiveBodiesApprox: number;
};
import type {
  PlayerPosition,
  NPCState,
  TriggerState,
  WorldItem,
  InteractionPrompt,
} from '@/data/rpgTypes';
import type { TravelToSceneOptions, TravelToSceneResult } from '@/state';

/**
 * Фасад над действиями мира (исследование, сцены, NPC, триггеры).
 * Пока делегирует в gameStore, после распила — напрямую в worldStore.
 */
export function useWorldActions() {
  const travelToScene = useCallback(
    (sceneId: SceneId, options?: TravelToSceneOptions): TravelToSceneResult => {
      return useGameStore.getState().travelToScene(sceneId, options);
    },
    []
  );

  const setCurrentScene = useCallback((sceneId: SceneId) => {
    useGameStore.getState().setCurrentScene(sceneId);
  }, []);

  const setPlayerPosition = useCallback((position: PlayerPosition) => {
    useGameStore.getState().setPlayerPosition(position);
  }, []);

  const advanceTime = useCallback((deltaHours: number) => {
    useGameStore.getState().advanceTime(deltaHours);
  }, []);

  const setNPCState = useCallback((npcId: string, state: NPCState) => {
    useGameStore.getState().setNPCState(npcId, state);
  }, []);

  const setTriggerState = useCallback((triggerId: string, state: TriggerState) => {
    useGameStore.getState().setTriggerState(triggerId, state);
  }, []);

  const addWorldItem = useCallback((item: WorldItem) => {
    useGameStore.getState().addWorldItem(item);
  }, []);

  const collectWorldItem = useCallback((itemId: string) => {
    useGameStore.getState().collectWorldItem(itemId);
  }, []);

  const setInteractionPrompt = useCallback((prompt: InteractionPrompt | null) => {
    useGameStore.getState().setInteractionPrompt(prompt);
  }, []);

  const addExploredArea = useCallback((areaId: string) => {
    useGameStore.getState().addExploredArea(areaId);
  }, []);

  const syncStreamingSnapshot = useCallback((snapshot: ExplorationStreamingSyncPayload) => {
    useGameStore.setState((s) => ({
      exploration: {
        ...s.exploration,
        streaming: {
          ...s.exploration.streaming,
          activeChunkIds: [...snapshot.activeChunkIds],
          unloadingChunkIds: [...snapshot.unloadingChunkIds],
          prefetchQueueLength: snapshot.prefetchQueueLength,
          prefetchTargetsPreview: [...snapshot.prefetchTargetsPreview],
          budgetTextureBytesApprox: snapshot.budgetTextureBytesApprox,
          rapierActiveBodiesApprox: snapshot.rapierActiveBodiesApprox,
        },
      },
    }));
  }, []);

  return {
    travelToScene,
    setCurrentScene,
    setPlayerPosition,
    advanceTime,
    setNPCState,
    setTriggerState,
    addWorldItem,
    collectWorldItem,
    setInteractionPrompt,
    addExploredArea,
    syncStreamingSnapshot,
  };
}
