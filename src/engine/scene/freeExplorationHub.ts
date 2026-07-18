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

/** INT-4: Track the hub location toast timer so it can be cancelled when a new
 *  hub is entered rapidly (preventing stale location text from the previous scene). */
let _hubToastTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Promote to a closed-overlay explore hub: spine tracking, closed overlay,
 * optional first-visit location toast. Player actions use 3D trigger zones.
 *
 * @param options.suppressLocationToast — skip the hub location toast. Use this
 *   when a story overlay is already open and providing scene context, to avoid
 *   duplicate text (e.g., wake-up prologue where start.text and hubIntroText
 *   both describe the same room).
 */
export function enterSceneFreeExplorationHub(
  hubId: string,
  options: { suppressLocationToast?: boolean } = {},
): void {
  if (!isClosedOverlayExploreHub(hubId)) return;

  // INT-4: Cancel any pending hub toast from a previous scene transition.
  if (_hubToastTimer !== null) {
    clearTimeout(_hubToastTimer);
    _hubToastTimer = null;
  }

  const snapshot = getGameSnapshot();
  const firstVisit = !hasVisitedNode(snapshot.playerState.visitedNodes, hubId);

  if (snapshot.currentNodeId !== hubId) {
    dispatchGameAction({ type: 'story/setCurrentNodeId', nodeId: hubId });
  }
  dispatchGameAction({ type: 'story/visitNode', nodeId: hubId });
  closeNarrativeOverlay();
  setCinematicHoldActive(false);

  // Skip the location toast when explicitly suppressed (e.g., during the
  // wake-up prologue where the story overlay already provides scene context).
  // Showing both start.text AND hubIntroText caused "три мониторы" to appear
  // multiple times simultaneously.
  if (!options.suppressLocationToast) {
    const capturedHubId = hubId;
    const capturedFirstVisit = firstVisit;
    _hubToastTimer = setTimeout(() => {
      _hubToastTimer = null;
      if (capturedFirstVisit) {
        showHubLocationContext(capturedHubId, false);
      } else {
        showHubLocationContext(capturedHubId, true);
      }
    }, EXPLORATION_HUD_HANDOFF.HUB_LOCATION_TOAST_MS);
  }

  // INT-2: Use only forceEmitInteractionEnd() to go through the dedup mechanism.
  // Previously a direct eventBus.emit('interaction:end', {}) was also called,
  // causing duplicate listener side-effects (camera recenter, audio stingers, etc.).
  forceEmitInteractionEnd();
}

/** @deprecated Use enterSceneFreeExplorationHub */
export const enterAct1FreeExplorationHub = enterSceneFreeExplorationHub;