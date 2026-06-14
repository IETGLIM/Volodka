import type { SceneId } from '@/shared/types/game';
import { dispatchStateAction, getGameSnapshot } from '@/shared/gameBridge/stateDispatcher';
import { getStoryNodeSceneId } from '@/shared/story/getStoryNodeSceneId';
import { isExploreHubNode } from '@/shared/sceneExploreHubRegistry';

export {
  EXPLORE_HUB_NODE_IDS,
  SCENE_TO_EXPLORE_HUB,
  SCENE_ENTRY_NODE_TO_HUB,
  isExploreHubNode,
  isClosedOverlayExploreHub,
  isAct1FreeExplorationHub,
  getExploreHubForScene,
  getSceneForExploreHub,
  resolveExploreHubNavigation,
} from '@/shared/sceneExploreHubRegistry';

/** True when narrative overlay should freeze player locomotion. */
export function isNarrativeMovementLocked(
  showStoryOverlay: boolean,
  currentNodeId: string,
): boolean {
  return showStoryOverlay && !isExploreHubNode(currentNodeId);
}

/**
 * After a physical scene transition, dismiss any open narrative overlay so the player
 * can explore freely. Story/dialogue only opens from interactions and cutscenes.
 */
export function syncNarrativeOnSceneEnter(sceneId: SceneId): void {
  const snapshot = getGameSnapshot();
  if (!snapshot.showStoryOverlay) return;

  const storySceneId = snapshot.currentNodeId
    ? getStoryNodeSceneId(snapshot.currentNodeId)
    : undefined;
  if (storySceneId === sceneId) return;

  dispatchStateAction({ type: 'story/closeNarrativeOverlay' });
}
