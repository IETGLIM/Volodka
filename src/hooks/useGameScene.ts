'use client';

import { useMemo } from 'react';
import { STORY_NODES } from '@/data/storyNodes';
import type { SceneId } from '@/data/types';
import { useGameRuntime, type UseGameRuntimeParams } from '@/hooks/useGameRuntime';
import { useQuestProgressBridge } from '@/hooks/useQuestProgress';

/** Параметры рантайма без производной сцены — `currentSceneId` считается здесь. */
export type UseGameSceneParams = Omit<UseGameRuntimeParams, 'currentSceneId'>;

/**
 * Узел сюжета, визуальная сцена, мост квест↔события и `useGameRuntime` (катсцены, стихи, достижения).
 */
export function useGameScene(params: UseGameSceneParams) {
  const currentNode = useMemo(
    () => STORY_NODES[params.currentNodeId] || STORY_NODES['start'],
    [params.currentNodeId],
  );

  const currentSceneId = useMemo((): SceneId => (currentNode?.scene as SceneId) || 'kitchen_night', [currentNode]);

  const { handleNPCInteraction: trackQuestNpcTalk, handleEvent: emitQuestEvent } =
    useQuestProgressBridge(currentSceneId);

  const runtime = useGameRuntime({
    ...params,
    currentSceneId,
  });

  return {
    currentNode,
    currentSceneId,
    trackQuestNpcTalk,
    emitQuestEvent,
    runtime,
  };
}
