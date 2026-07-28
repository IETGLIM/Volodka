import {
  ensureDialogueNode,
  ensureStoryNode,
  getDialogueNodes,
  getStoryNodes,
} from '@/data/gameDataLoader';
import { eventBus } from '@/engine/EventBus';
import { openNarrativeOverlay } from '@/engine/scene/narrativeOverlay';
import {
  dispatchGameAction,
  getGameSnapshot,
} from '@/engine/GameActionDispatcher';
import { hasVisitedNode } from '@/store/visitedNodesIndex';
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
  dispatchGameAction({
    type: 'notification/push',
    notificationType: 'quest',
    text: userMessageForKind(kind),
  });
}

/** Command travel via EventBus — binder owns dedupe + requestSceneTransition. */
function emitSceneTransitionRequest(sceneId: string | undefined): void {
  if (!sceneId) return;
  eventBus.emit('scene:request_transition', {
    targetScene: sceneId as SceneId,
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
    emitSceneTransitionRequest(storyNode.sceneId);
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

  const alreadyVisited = hasVisitedNode(getGameSnapshot().playerState.visitedNodes, nodeId);
  if (alreadyVisited && dlgNode.sceneId) {
    emitSceneTransitionRequest(dlgNode.sceneId);
    return true;
  }

  emitSceneTransitionRequest(dlgNode.sceneId);
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

  const alreadyVisited = hasVisitedNode(getGameSnapshot().playerState.visitedNodes, nodeId);
  if (alreadyVisited && storyNode.sceneId) {
    emitSceneTransitionRequest(storyNode.sceneId);
    return true;
  }

  emitSceneTransitionRequest(storyNode.sceneId);
  openNarrativeOverlay(nodeId, 'story');
  return true;
}
