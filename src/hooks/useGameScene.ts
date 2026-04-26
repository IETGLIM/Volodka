'use client';

import { useMemo } from 'react';
import { STORY_NODES } from '@/data/storyNodes';
import { isExplorationHubStoryNodeId } from '@/data/explorationHubStory';
import type { SceneId } from '@/data/types';
import { useGameRuntime, type UseGameRuntimeParams } from '@/hooks/useGameRuntime';
import { useQuestProgressBridge } from '@/hooks/useQuestProgress';

/** Параметры рантайма без производной сцены — `currentSceneId` считается здесь. */
export type UseGameSceneParams = Omit<UseGameRuntimeParams, 'currentSceneId'> & {
  explorationCurrentSceneId: SceneId;
};

/**
 * Узел сюжета, сцена узла, мост квест↔события и `useGameRuntime` (катсцены, стихи, достижения).
 */
export function useGameScene(params: UseGameSceneParams) {
  const { explorationCurrentSceneId, ...runtimeParams } = params;

  const currentNode = useMemo(
    () => STORY_NODES[runtimeParams.currentNodeId] || STORY_NODES['start'],
    [runtimeParams.currentNodeId],
  );

  const currentSceneId = useMemo((): SceneId => (currentNode?.scene as SceneId) || 'kitchen_night', [currentNode]);

  /** В хабе обхода — фактическая 3D-локация; на сюжетном узле — сцена узла (синхрон с `travelToScene` в рантайме). */
  const questSceneId = isExplorationHubStoryNodeId(runtimeParams.currentNodeId)
    ? explorationCurrentSceneId
    : currentSceneId;

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
