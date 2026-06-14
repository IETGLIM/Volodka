import { getCutsceneForNode } from '@/data/cutscenes';
import { dispatchGameAction } from '@/engine/GameActionDispatcher';
import { eventBus } from '@/engine/EventBus';
import { forceEmitInteractionEnd } from '@/engine/interaction/interactionEndDedup';
import { enterSceneFreeExplorationHub } from '@/engine/scene/freeExplorationHub';
import { openNarrativeOverlay } from '@/engine/scene/narrativeOverlay';
import {
  isClosedOverlayExploreHub,
  SCENE_ENTRY_NODE_TO_HUB,
} from '@/shared/sceneExploreHubRegistry';
import type { NarrativeKind } from '@/shared/types/narrativeKind';

/** Entry beats (corridor_door, kitchen_table, …) map to explore hubs after the player reads them. */
export function shouldShowEntryStoryAfterCutscene(nodeId: string): boolean {
  const hubId = SCENE_ENTRY_NODE_TO_HUB[nodeId];
  return hubId != null && hubId !== nodeId;
}

/** Title-card cutscenes and scene entry beats must open VN text — never a silent hub jump. */
export function shouldShowStoryBeatAfterCutscene(nodeId: string): boolean {
  if (shouldShowEntryStoryAfterCutscene(nodeId)) return true;
  return getCutsceneForNode(nodeId) != null;
}

/** Entry beats (e.g. corridor_door) promote to their explore hub after a cutscene. */
export function resolvePostCutsceneNarrativeNode(nodeId: string): string {
  const hubId = SCENE_ENTRY_NODE_TO_HUB[nodeId];
  return hubId && hubId !== nodeId ? hubId : nodeId;
}

/** After cinematic beats: closed-overlay hubs dismiss VN panel; others keep walkable hub overlay. */
export function openNarrativeAfterCutscene(nodeId: string, kind: NarrativeKind): void {
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
