import { getSceneConfig } from '@/config/scenes';
import { dispatchGameAction, getGameSnapshot } from '@/engine/GameActionDispatcher';
import { eventBus } from '@/engine/EventBus';
import { forceEmitInteractionEnd } from '@/engine/interaction/interactionEndDedup';
import { closeNarrativeOverlay } from '@/engine/scene/narrativeOverlay';
import {
  getExploreHubDef,
  isClosedOverlayExploreHub,
} from '@/shared/sceneExploreHubRegistry';
import { hasVisitedNode } from '@/store/visitedNodesIndex';

/** One-shot diegetic location context on first hub enter (revisit = silent). */
function showHubLocationContext(hubId: string): void {
  const def = getExploreHubDef(hubId);
  if (!def) return;

  const sceneName = getSceneConfig(def.sceneId).name;
  eventBus.emit('game:notification', {
    title: sceneName,
    subtitle: def.hubText,
    type: 'scene',
  });
}

/**
 * Promote to a closed-overlay explore hub: spine tracking, closed overlay,
 * optional first-visit location toast. Player actions use 3D trigger zones.
 */
export function enterSceneFreeExplorationHub(hubId: string): void {
  if (!isClosedOverlayExploreHub(hubId)) return;

  const snapshot = getGameSnapshot();
  const firstVisit = !hasVisitedNode(snapshot.playerState.visitedNodes, hubId);

  if (snapshot.currentNodeId !== hubId) {
    dispatchGameAction({ type: 'story/setCurrentNodeId', nodeId: hubId });
  }
  dispatchGameAction({ type: 'story/visitNode', nodeId: hubId });
  closeNarrativeOverlay();

  if (firstVisit) {
    showHubLocationContext(hubId);
  }

  eventBus.emit('interaction:end', {});
  forceEmitInteractionEnd();
}

/** @deprecated Use enterSceneFreeExplorationHub */
export const enterAct1FreeExplorationHub = enterSceneFreeExplorationHub;
