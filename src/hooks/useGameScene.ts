'use client';

import { useMemo } from 'react';
import { STORY_NODES } from '@/data/storyNodes';
import type { SceneId } from '@/data/types';
import type { GameMode } from '@/data/rpgTypes';
import { useGameRuntime, type UseGameRuntimeParams } from '@/hooks/useGameRuntime';
import { useQuestProgressBridge } from '@/hooks/useQuestProgress';

/** Параметры рантайма без производной сцены — `currentSceneId` считается здесь. */
export type UseGameSceneParams = Omit<UseGameRuntimeParams, 'currentSceneId'> & {
  gameMode: GameMode;
  explorationCurrentSceneId: SceneId;
};

/**
 * Узел сюжета, визуальная сцена, мост квест↔события и `useGameRuntime` (катсцены, стихи, достижения).
 */
export function useGameScene(params: UseGameSceneParams) {
  const { gameMode, explorationCurrentSceneId, ...runtimeParams } = params;

  const currentNode = useMemo(
    () => STORY_NODES[runtimeParams.currentNodeId] || STORY_NODES['start'],
    [runtimeParams.currentNodeId],
  );

  const currentSceneId = useMemo((): SceneId => (currentNode?.scene as SceneId) || 'kitchen_night', [currentNode]);

  const questSceneId = gameMode === 'exploration' ? explorationCurrentSceneId : currentSceneId;

  const { handleNPCInteraction: trackQuestNpcTalk, handleEvent: emitQuestEvent } =
    useQuestProgressBridge(questSceneId);

  const runtime = useGameRuntime({
    ...runtimeParams,
    currentSceneId,
    explorationCurrentSceneId,
  });

  return {
    currentNode,
    currentSceneId,
    trackQuestNpcTalk,
    emitQuestEvent,
    runtime,
  };
}
