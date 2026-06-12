import { getSceneConfig } from '@/config/scenes';
import { dispatchGameAction, getGameSnapshot } from '@/engine/GameActionDispatcher';
import { eventBus } from '@/engine/EventBus';
import { forceEmitInteractionEnd } from '@/engine/interaction/interactionEndDedup';
import { closeNarrativeOverlay } from '@/engine/scene/narrativeOverlay';
import {
  getExploreHubDef,
  isAct1FreeExplorationHub,
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
 * Promote to an Act I free-exploration hub: spine tracking, closed overlay,
 * optional first-visit location toast. Player actions use 3D trigger zones.
 */
export function enterAct1FreeExplorationHub(hubId: string): void {
  if (!isAct1FreeExplorationHub(hubId)) return;

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
