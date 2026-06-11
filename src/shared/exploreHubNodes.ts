import type { SceneId } from '@/shared/types/game';
import { getStoryNodeSceneId } from '@/engine/guidedStory/createGuidedStoryDeps';
import { getGameStore } from '@/store/gameStore';
import {
  EXPLORE_HUB_NODE_IDS,
  SCENE_ENTRY_NODE_TO_HUB,
  SCENE_TO_EXPLORE_HUB,
  getExploreHubForScene,
  isExploreHubNode,
  resolveExploreHubNavigation,
} from '@/shared/sceneExploreHubRegistry';

export {
  EXPLORE_HUB_NODE_IDS,
  SCENE_TO_EXPLORE_HUB,
  SCENE_ENTRY_NODE_TO_HUB,
  isExploreHubNode,
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
 * After a physical scene transition, keep narrative overlay in sync so movement is not
 * left frozen on door/entry/beat nodes while the player is already in-scene.
 */
export function syncNarrativeOnSceneEnter(sceneId: SceneId): void {
  const store = getGameStore();
  if (!store.showStoryOverlay) return;

  const nodeId = store.currentNodeId;
  const kind = store.narrativeKind ?? 'story';
  const hubForScene = getExploreHubForScene(sceneId);

  const entryHub = SCENE_ENTRY_NODE_TO_HUB[nodeId];
  if (entryHub && getStoryNodeSceneId(nodeId) === sceneId) {
    store.openNarrativeOverlay(entryHub, kind);
    return;
  }

  if (!isNarrativeMovementLocked(store.showStoryOverlay, nodeId)) return;

  const nodeSceneId = getStoryNodeSceneId(nodeId);
  if (nodeSceneId === sceneId) {
    if (hubForScene && nodeId !== hubForScene) {
      store.openNarrativeOverlay(hubForScene, kind);
    }
    return;
  }

  if (hubForScene) {
    store.openNarrativeOverlay(hubForScene, kind);
    return;
  }

  store.closeNarrativeOverlay();
}
