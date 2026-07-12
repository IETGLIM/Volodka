import { getCutsceneForNode } from '@/data/cutscenes';
import { dispatchGameAction } from '@/engine/GameActionDispatcher';
import { eventBus } from '@/engine/EventBus';
import { forceEmitInteractionEnd } from '@/engine/interaction/interactionEndDedup';
import { openDiegeticNarrative } from '@/engine/scene/narrativeOverlay';
import { enterSceneFreeExplorationHub } from '@/engine/scene/freeExplorationHub';
import { openNarrativeOverlay } from '@/engine/scene/narrativeOverlay';
import {
  isClosedOverlayExploreHub,
  SCENE_ENTRY_NODE_TO_HUB,
} from '@/shared/sceneExploreHubRegistry';
import type { NarrativeKind } from '@/shared/types/narrativeKind';
import {
  shouldShowEntryStoryAfterCutscene,
  shouldUseDiegeticPostCutsceneFlow,
  isAct1DiegeticStoryNode,
} from '@/engine/narrative/narrativePresentationPolicy';

export { shouldShowEntryStoryAfterCutscene } from '@/engine/narrative/narrativePresentationPolicy';

/** After cutscene: Act 1 uses diegetic/hub flow; Acts 2+ keep VN overlay. */
export function shouldShowStoryBeatAfterCutscene(nodeId: string): boolean {
  if (shouldUseDiegeticPostCutsceneFlow(nodeId)) return false;
  if (shouldShowEntryStoryAfterCutscene(nodeId)) return true;
  return getCutsceneForNode(nodeId) != null;
}

/** Entry beats (e.g. corridor_door) promote to their explore hub after a cutscene. */
export function resolvePostCutsceneNarrativeNode(nodeId: string): string {
  const hubId = SCENE_ENTRY_NODE_TO_HUB[nodeId];
  return hubId && hubId !== nodeId ? hubId : nodeId;
}

/** After cinematic beats: Act 1 → hub or diegetic HUD; legacy acts → VN overlay. */
export function openNarrativeAfterCutscene(nodeId: string, kind: NarrativeKind): void {
  if (isAct1DiegeticStoryNode(nodeId)) {
    const resolved = resolvePostCutsceneNarrativeNode(nodeId);

    if (isClosedOverlayExploreHub(resolved)) {
      if (resolved !== nodeId) {
        dispatchGameAction({ type: 'story/visitNode', nodeId });
      }
      enterSceneFreeExplorationHub(resolved);
      eventBus.emit('interaction:end', {});
      forceEmitInteractionEnd();
      return;
    }

    if (resolved !== nodeId) {
      dispatchGameAction({ type: 'story/visitNode', nodeId: resolved });
    }
    openDiegeticNarrative(resolved, kind);
    eventBus.emit('interaction:end', {});
    forceEmitInteractionEnd();
    return;
  }

  if (shouldShowStoryBeatAfterCutscene(nodeId)) {
    openNarrativeOverlay(nodeId, kind);
    eventBus.emit('interaction:end', {});
    forceEmitInteractionEnd();
    return;
  }

  const resolved = resolvePostCutsceneNarrativeNode(nodeId);

  if (isClosedOverlayExploreHub(resolved)) {
    if (resolved !== nodeId) {
      dispatchGameAction({ type: 'story/visitNode', nodeId });
    }
    enterSceneFreeExplorationHub(resolved);
    return;
  }

  if (resolved !== nodeId) {
    dispatchGameAction({ type: 'story/visitNode', nodeId: resolved });
  }
  openNarrativeOverlay(resolved, kind);
  eventBus.emit('interaction:end', {});
  forceEmitInteractionEnd();
}
