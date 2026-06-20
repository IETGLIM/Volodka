import { getSceneConfig } from '@/config/scenes';
import { dispatchGameAction, getGameSnapshot } from '@/engine/GameActionDispatcher';
import { eventBus } from '@/engine/EventBus';
import { forceEmitInteractionEnd } from '@/engine/interaction/interactionEndDedup';
import { closeNarrativeOverlay } from '@/engine/scene/narrativeOverlay';
import {
  getExploreHubDef,
  isClosedOverlayExploreHub,
} from '@/shared/sceneExploreHubRegistry';
import {
  resolveExploreHubIntroText,
  resolveExploreHubRevisitText,
} from '@/shared/contentTruthManifest';
import { hasVisitedNode } from '@/shared/visitedNodesIndex';
import { setCinematicHoldActive } from '@/engine/camera/cinematicPresentation';
import { EXPLORATION_HUD_HANDOFF } from '@/shared/constants/transitionTimings';

/** One-shot diegetic location context on first hub enter; shorter line on revisit. */
function showHubLocationContext(hubId: string, revisit: boolean): void {
  const def = getExploreHubDef(hubId);
  if (!def) return;

  if (revisit) {
    const revisitText = resolveExploreHubRevisitText(hubId);
    if (revisitText) {
      eventBus.emit('ui:exploration_message', { text: revisitText });
    }
    return;
  }

  const introText = resolveExploreHubIntroText(hubId);
  if (!introText) return;

  const sceneName = getSceneConfig(def.sceneId).name;
  eventBus.emit('game:notification', {
    title: sceneName,
    subtitle: introText,
    type: 'scene',
  });
}

/** Defer hub location toast so it does not overlap scene-transition / guidance HUD handoff. */

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
  setCinematicHoldActive(false);

  setTimeout(() => {
    if (firstVisit) {
      showHubLocationContext(hubId, false);
    } else {
      showHubLocationContext(hubId, true);
    }
  }, EXPLORATION_HUD_HANDOFF.HUB_LOCATION_TOAST_MS);

  eventBus.emit('interaction:end', {});
  forceEmitInteractionEnd();
}

/** @deprecated Use enterSceneFreeExplorationHub */
export const enterAct1FreeExplorationHub = enterSceneFreeExplorationHub;
