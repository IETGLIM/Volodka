import {
  ensureDialogueNode,
  ensureStoryNode,
  getDialogueNodes,
  getStoryNodes,
} from '@/data/gameDataLoader';
import { requestSceneTransition } from '@/engine/scene/sceneTransition';
import { openNarrativeOverlay } from '@/engine/scene/narrativeOverlay';
import { useGameStore } from '@/store/gameStore';
import { hasVisitedNode } from '@/store/visitedNodesIndex';
import { SCENE_ENTRY_NODE_TO_HUB } from '@/shared/sceneExploreHubRegistry';
import { devWarn } from '@/shared/utils/devLog';
import type { SceneId } from '@/shared/types/game';

type NarrativeKind = 'dialogue' | 'story';

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
  useGameStore.getState().pushNotification('quest', userMessageForKind(kind));
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

  const store = useGameStore.getState();
  const alreadyVisited = hasVisitedNode(store.playerState.visitedNodes, nodeId);
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

  const store = useGameStore.getState();

  // Door/arrival beats — mark visited and walk through without a story panel.
  if (SCENE_ENTRY_NODE_TO_HUB[nodeId] && storyNode.sceneId) {
    store.visitNode(nodeId);
    if (store.exploration.currentSceneId !== storyNode.sceneId) {
      requestSceneTransition(storyNode.sceneId as SceneId);
    }
    return true;
  }

  const alreadyVisited = hasVisitedNode(store.playerState.visitedNodes, nodeId);
  if (alreadyVisited && storyNode.sceneId) {
    requestSceneTransition(storyNode.sceneId as SceneId);
    return true;
  }

  openNarrativeOverlay(nodeId, 'story');
  return true;
}
