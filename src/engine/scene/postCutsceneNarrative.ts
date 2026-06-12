import { dispatchGameAction } from '@/engine/GameActionDispatcher';
import { eventBus } from '@/engine/EventBus';
import { forceEmitInteractionEnd } from '@/engine/interaction/interactionEndDedup';
import { openNarrativeOverlay } from '@/engine/scene/narrativeOverlay';
import { SCENE_ENTRY_NODE_TO_HUB } from '@/shared/sceneExploreHubRegistry';
import type { NarrativeKind } from '@/store/slices/uiSlice';

/** Entry beats (e.g. corridor_door) promote to their explore hub after a cutscene. */
export function resolvePostCutsceneNarrativeNode(nodeId: string): string {
  const hubId = SCENE_ENTRY_NODE_TO_HUB[nodeId];
  return hubId && hubId !== nodeId ? hubId : nodeId;
}

/** Open walkable explore hub overlay and release interaction locks after cinematic beats. */
export function openNarrativeAfterCutscene(nodeId: string, kind: NarrativeKind): void {
  const resolved = resolvePostCutsceneNarrativeNode(nodeId);
  if (resolved !== nodeId) {
    dispatchGameAction({ type: 'story/visitNode', nodeId: resolved });
  }
  openNarrativeOverlay(resolved, kind);
  eventBus.emit('interaction:end', {});
  forceEmitInteractionEnd();
}
