import { dispatchGameAction } from '@/engine/GameActionDispatcher';
import { eventBus } from '@/engine/EventBus';
import { forceEmitInteractionEnd } from '@/engine/interaction/interactionEndDedup';
import { enterAct1FreeExplorationHub } from '@/engine/scene/freeExplorationHub';
import { openNarrativeOverlay } from '@/engine/scene/narrativeOverlay';
import {
  isAct1FreeExplorationHub,
  SCENE_ENTRY_NODE_TO_HUB,
} from '@/shared/sceneExploreHubRegistry';
import type { NarrativeKind } from '@/store/slices/uiSlice';

/** Entry beats (e.g. corridor_door) promote to their explore hub after a cutscene. */
export function resolvePostCutsceneNarrativeNode(nodeId: string): string {
  const hubId = SCENE_ENTRY_NODE_TO_HUB[nodeId];
  return hubId && hubId !== nodeId ? hubId : nodeId;
}

/** After cinematic beats: Act I hubs close overlay; later acts keep walkable hub overlay. */
export function openNarrativeAfterCutscene(nodeId: string, kind: NarrativeKind): void {
  const resolved = resolvePostCutsceneNarrativeNode(nodeId);

  if (isAct1FreeExplorationHub(resolved)) {
    if (resolved !== nodeId) {
      dispatchGameAction({ type: 'story/visitNode', nodeId });
    }
    enterAct1FreeExplorationHub(resolved);
    return;
  }

  if (resolved !== nodeId) {
    dispatchGameAction({ type: 'story/visitNode', nodeId: resolved });
  }
  openNarrativeOverlay(resolved, kind);
  eventBus.emit('interaction:end', {});
  forceEmitInteractionEnd();
}
