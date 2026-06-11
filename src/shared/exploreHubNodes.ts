import type { SceneId } from '@/shared/types/game';
import { getStoryNodeSceneId } from '@/engine/guidedStory/createGuidedStoryDeps';
import { getGameStore } from '@/store/gameStore';

/** Story nodes that act as in-world exploration hubs — overlay may stay open but movement is allowed. */
export const EXPLORE_HUB_NODE_IDS = new Set([
  'explore_mode',
  'corridor_explore_mode',
  'street_bench_view',
]);

/** Per-scene explore hub when the player arrives via a door while overlay is open. */
export const SCENE_TO_EXPLORE_HUB: Partial<Record<SceneId, string>> = {
  volodka_room: 'explore_mode',
  volodka_corridor: 'corridor_explore_mode',
  street_night: 'street_bench_view',
};

/** Door/entry story nodes promoted to explore hubs once the player is physically in-scene. */
export const SCENE_ENTRY_NODE_TO_HUB: Record<string, string> = {
  corridor_door: 'corridor_explore_mode',
  go_home: 'explore_mode',
  street_bench: 'street_bench_view',
};

export function isExploreHubNode(nodeId: string): boolean {
  return EXPLORE_HUB_NODE_IDS.has(nodeId);
}

/** True when narrative overlay should freeze player locomotion. */
export function isNarrativeMovementLocked(
  showStoryOverlay: boolean,
  currentNodeId: string,
): boolean {
  return showStoryOverlay && !isExploreHubNode(currentNodeId);
}

/**
 * After a physical scene transition, keep narrative overlay in sync so movement is not
 * left frozen on door/entry nodes (e.g. corridor_door while already in the corridor).
 */
export function syncNarrativeOnSceneEnter(sceneId: SceneId): void {
  const store = getGameStore();
  if (!store.showStoryOverlay) return;

  const nodeId = store.currentNodeId;
  const kind = store.narrativeKind ?? 'story';

  const entryHub = SCENE_ENTRY_NODE_TO_HUB[nodeId];
  if (entryHub && getStoryNodeSceneId(nodeId) === sceneId) {
    store.openNarrativeOverlay(entryHub, kind);
    return;
  }

  if (!isNarrativeMovementLocked(store.showStoryOverlay, nodeId)) return;

  const nodeSceneId = getStoryNodeSceneId(nodeId);
  if (nodeSceneId === sceneId) return;

  const hubForScene = SCENE_TO_EXPLORE_HUB[sceneId];
  if (hubForScene) {
    store.openNarrativeOverlay(hubForScene, kind);
    return;
  }

  store.closeNarrativeOverlay();
}
