import {
  ensureDialogueNode,
  ensureStoryNode,
  getDialogueNodes,
  getStoryNodes,
} from '@/data/gameDataLoader';
import { dispatchStateAction, getGameSnapshot } from '@/engine/StateDispatcher';
import type { NarrativeKind } from '@/shared/types/narrativeKind';
import { hasVisitedNode } from '@/shared/visitedNodesIndex';
import { openNarrativeOverlay, closeNarrativeOverlay } from '@/engine/scene/narrativeOverlay';
import { requestSceneTransition } from '@/engine/scene/sceneTransition';
import { getCutsceneForNode } from '@/data/cutscenes';
import {
  SCENE_ENTRY_NODE_TO_HUB,
  getExploreHubDefForScene,
  isClosedOverlayExploreHub,
  isExploreHubNode,
} from '@/shared/sceneExploreHubRegistry';
import { getStoryNodeSceneId } from '@/engine/guidedStory/createGuidedStoryDeps';
import { enterSceneFreeExplorationHub } from '@/engine/scene/freeExplorationHub';
import { devWarn } from '@/shared/utils/devLog';
import type { SceneId } from '@/shared/types/game';

/** Entry beats that only fire from specific source scenes (avoid replay when backtracking). */
const ENTRY_BEAT_SOURCE_SCENES: Partial<Record<string, readonly SceneId[]>> = {
  corridor_door: ['volodka_room'],
};

function isNaturalEntryTransition(
  entryNodeId: string,
  fromSceneId: SceneId,
  toSceneId: SceneId,
): boolean {
  const allowedFrom = ENTRY_BEAT_SOURCE_SCENES[entryNodeId];
  if (allowedFrom) {
    return allowedFrom.includes(fromSceneId);
  }
  return fromSceneId !== toSceneId;
}

function userMessageForKind(kind: NarrativeKind): string {
  return kind === 'dialogue' ? 'Диалог недоступен' : 'Сцена недоступна';
}

function notifyNarrativeUnavailable(
  kind: NarrativeKind,
  nodeId: string,
  reason: 'missing' | 'load_failed',
  error?: unknown,
): void {
  if (reason === 'load_failed') {
    devWarn(`[narrative] Failed to load ${kind} pack for node "${nodeId}"`, error);
  } else {
    devWarn(`[narrative] ${kind} node not found: "${nodeId}"`);
  }
  dispatchStateAction({
    type: 'notification/push',
    notificationType: 'quest',
    text: userMessageForKind(kind),
  });
}

export async function tryOpenDialogue(nodeId: string): Promise<boolean> {
  try {
    await ensureDialogueNode(nodeId);
    if (getDialogueNodes()[nodeId]) {
      openNarrativeOverlay(nodeId, 'dialogue');
      return true;
    }
    notifyNarrativeUnavailable('dialogue', nodeId, 'missing');
  } catch (error) {
    notifyNarrativeUnavailable('dialogue', nodeId, 'load_failed', error);
  }
  return false;
}

export async function tryOpenStory(nodeId: string): Promise<boolean> {
  try {
    await ensureStoryNode(nodeId);
    const storyNode = getStoryNodes()[nodeId];
    if (!storyNode) {
      notifyNarrativeUnavailable('story', nodeId, 'missing');
      return false;
    }
    openNarrativeOverlay(nodeId, 'story');
    return true;
  } catch (error) {
    notifyNarrativeUnavailable('story', nodeId, 'load_failed', error);
  }
  return false;
}

/** Zone/object linked dialogue — includes scene transition for visited nodes. */
export async function openLinkedDialogue(nodeId: string): Promise<boolean> {
  try {
    await ensureDialogueNode(nodeId);
  } catch (error) {
    notifyNarrativeUnavailable('dialogue', nodeId, 'load_failed', error);
    return false;
  }

  const dlgNode = getDialogueNodes()[nodeId];
  if (!dlgNode) {
    notifyNarrativeUnavailable('dialogue', nodeId, 'missing');
    return false;
  }

  const snapshot = getGameSnapshot();
  const alreadyVisited = hasVisitedNode(snapshot.playerState.visitedNodes, nodeId);
  if (alreadyVisited && dlgNode.sceneId) {
    requestSceneTransition(dlgNode.sceneId as SceneId);
    return true;
  }

  openNarrativeOverlay(nodeId, 'dialogue');
  return true;
}

/** Zone/object linked story — includes scene transition for visited nodes. */
export async function openLinkedStory(nodeId: string): Promise<boolean> {
  try {
    await ensureStoryNode(nodeId);
  } catch (error) {
    notifyNarrativeUnavailable('story', nodeId, 'load_failed', error);
    return false;
  }

  const storyNode = getStoryNodes()[nodeId];
  if (!storyNode) {
    notifyNarrativeUnavailable('story', nodeId, 'missing');
    return false;
  }

  const snapshot = getGameSnapshot();

  // Door/arrival beats — first visit plays cutscene + story; revisit walks through to hub.
  const entryHubId = SCENE_ENTRY_NODE_TO_HUB[nodeId];
  if (entryHubId && storyNode.sceneId) {
    const alreadyVisited = hasVisitedNode(snapshot.playerState.visitedNodes, nodeId);

    if (alreadyVisited) {
      dispatchStateAction({ type: 'story/visitNode', nodeId });
      if (entryHubId !== nodeId) {
        if (isClosedOverlayExploreHub(entryHubId)) {
          enterSceneFreeExplorationHub(entryHubId);
        } else {
          dispatchStateAction({ type: 'story/visitNode', nodeId: entryHubId });
          dispatchStateAction({ type: 'story/setCurrentNodeId', nodeId: entryHubId });
        }
      }
      if (snapshot.exploration.currentSceneId !== storyNode.sceneId) {
        requestSceneTransition(storyNode.sceneId as SceneId);
      }
      return true;
    }

    dispatchStateAction({ type: 'story/visitNode', nodeId });
    if (snapshot.exploration.currentSceneId !== storyNode.sceneId) {
      requestSceneTransition(storyNode.sceneId as SceneId);
    }
    dispatchStateAction({ type: 'story/setCurrentNodeId', nodeId });
    if (!getCutsceneForNode(nodeId)) {
      openNarrativeOverlay(nodeId, 'story');
    }
    return true;
  }

  const alreadyVisited = hasVisitedNode(snapshot.playerState.visitedNodes, nodeId);
  if (alreadyVisited && storyNode.sceneId) {
    requestSceneTransition(storyNode.sceneId as SceneId);
    return true;
  }

  openNarrativeOverlay(nodeId, 'story');
  return true;
}

/**
 * After a physical scene transition, play door/arrival entry beats (e.g. corridor_door cutscene)
 * when the player walked through a scene exit instead of using a linked trigger zone.
 */
export function triggerSceneEntryStoryIfNeeded(
  toSceneId: SceneId,
  fromSceneId: SceneId,
): void {
  const snapshot = getGameSnapshot();
  if (snapshot.activeCutsceneId) return;

  const hubDef = getExploreHubDefForScene(toSceneId);
  if (!hubDef || hubDef.entryNodeIds.length === 0) return;

  const currentNodeId = snapshot.currentNodeId;
  const currentStorySceneId =
    currentNodeId != null ? getStoryNodeSceneId(currentNodeId) : undefined;
  if (
    currentNodeId != null &&
    !isExploreHubNode(currentNodeId) &&
    currentStorySceneId === toSceneId &&
    !hubDef.entryNodeIds.includes(currentNodeId)
  ) {
    return;
  }

  for (const entryNodeId of hubDef.entryNodeIds) {
    if (!isNaturalEntryTransition(entryNodeId, fromSceneId, toSceneId)) {
      continue;
    }

    const cutscene = getCutsceneForNode(entryNodeId);
    const cutscenePending =
      cutscene != null && !snapshot.triggeredCutscenes.includes(cutscene.id);

    if (snapshot.currentNodeId === entryNodeId) {
      const hubId = SCENE_ENTRY_NODE_TO_HUB[entryNodeId];
      if (cutscenePending) {
        closeNarrativeOverlay();
        if (hubId && hubId !== entryNodeId) {
          dispatchStateAction({ type: 'story/setCurrentNodeId', nodeId: hubId });
          queueMicrotask(() => {
            dispatchStateAction({ type: 'story/visitNode', nodeId: entryNodeId });
            dispatchStateAction({ type: 'story/setCurrentNodeId', nodeId: entryNodeId });
          });
        }
      } else if (hubId && hubId !== entryNodeId) {
        if (snapshot.activeCutsceneId) {
          dispatchStateAction({ type: 'cutscene/clear' });
          dispatchStateAction({ type: 'phase/clearGameplayFlags' });
          closeNarrativeOverlay();
        }
        if (isClosedOverlayExploreHub(hubId)) {
          enterSceneFreeExplorationHub(hubId);
        } else {
          dispatchStateAction({ type: 'story/visitNode', nodeId: hubId });
          dispatchStateAction({ type: 'story/setCurrentNodeId', nodeId: hubId });
          closeNarrativeOverlay();
        }
      }
      return;
    }

    const hubId = SCENE_ENTRY_NODE_TO_HUB[entryNodeId];
    const onHub = hubId != null && snapshot.currentNodeId === hubId;
    const visited = hasVisitedNode(snapshot.playerState.visitedNodes, entryNodeId);

    if (!visited || cutscenePending) {
      void openLinkedStory(entryNodeId).catch((error) => {
        devWarn('[narrative] triggerSceneEntryStoryIfNeeded failed:', entryNodeId, error);
      });
      return;
    }

    if (hubId && !onHub) {
      if (isClosedOverlayExploreHub(hubId)) {
        enterSceneFreeExplorationHub(hubId);
      } else {
        dispatchStateAction({ type: 'story/visitNode', nodeId: hubId });
        dispatchStateAction({ type: 'story/setCurrentNodeId', nodeId: hubId });
      }
      return;
    }
  }
}
