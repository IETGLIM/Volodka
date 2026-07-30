import {
  ensureDialogueNode,
  ensureStoryNode,
  getDialogueNodes,
  getStoryNodes,
} from '@/data/gameDataLoader';
import { dispatchStateAction, getGameSnapshot } from '@/engine/StateDispatcher';
import type { NarrativeKind } from '@/shared/types/narrativeKind';
import { hasVisitedNode } from '@/shared/visitedNodesIndex';
import { closeNarrativeOverlay } from '@/engine/scene/narrativeOverlay';
import { presentNarrativeBeat } from '@/engine/narrative/presentNarrativeBeat';
import { requestSceneTransition } from '@/engine/scene/sceneTransition';
import { getCutsceneForNode } from '@/data/cutscenes';
import {
  SCENE_ENTRY_NODE_TO_HUB,
  getExploreHubDefForScene,
  isClosedOverlayExploreHub,
  isExploreHubNode,
} from '@/shared/sceneExploreHubRegistry';
import { getStoryNodeSceneId } from '@/engine/guidedStory/createGuidedStoryDeps';
import { enterSceneFreeExplorationHub } from '@/engine/scene/freeExplorationHub';
import { devWarn } from '@/shared/utils/devLog';
import type { SceneId } from '@/shared/types/game';
import { emitInteractionEndIfNeeded } from '@/engine/interaction/interactionEndDedup';
import { resolveDialogueEntryNodeId } from '@/engine/dialogue/resolveDialoguePresentation';
import {
  armEntryBeatFromZone,
  consumeEntryBeatFromZone,
  getEntryBeatGeneration,
  isEntryBeatInFlight,
  markEntryBeatHubPromoted,
  resetEntryBeatState,
} from '@/engine/interaction/entryBeatState';
import { isCinematicTimelineActive } from '@/engine/cinematic/cinematicTimelineOrchestrator';

/** Guards against concurrent openLinkedStory calls from rapid scene transitions. */
let entryStoryInFlight = false;

/** After async pack load — refuse to present if cinema/cutscene took over mid-await. */
function shouldAbortNarrativePresentation(): boolean {
  const snapshot = getGameSnapshot();
  if (snapshot.activeCutsceneId) return true;
  try {
    if (isCinematicTimelineActive()) return true;
  } catch {
    /* orchestrator unavailable during teardown */
  }
  return false;
}

export {
  consumePendingEntryBeatFromZoneInteraction,
  peekPendingEntryBeatFromZoneInteraction,
  resetPendingEntryBeatFromZoneInteraction,
} from '@/engine/interaction/entryBeatState';

/** Entry beats that only fire from specific source scenes (avoid replay when backtracking). */
const ENTRY_BEAT_SOURCE_SCENES: Partial<Record<string, readonly SceneId[]>> = {
  corridor_door: ['volodka_room'],
};

function isNaturalEntryTransition(
  entryNodeId: string,
  fromSceneId: SceneId,
  toSceneId: SceneId,
): boolean {
  const allowedFrom = ENTRY_BEAT_SOURCE_SCENES[entryNodeId];
  if (allowedFrom) {
    return allowedFrom.includes(fromSceneId);
  }
  return fromSceneId !== toSceneId;
}

function userMessageForKind(kind: NarrativeKind, nodeId: string, reason: 'missing' | 'load_failed'): string {
  if (reason === 'load_failed') {
    return kind === 'dialogue'
      ? 'Не удалось загрузить диалог. Проверьте подключение и обновите страницу.'
      : 'Не удалось загрузить сцену. Проверьте подключение и обновите страницу.';
  }
  return kind === 'dialogue'
    ? `Диалог "${nodeId}" не найден. Попробуйте перезайти в сцену.`
    : `Сцена "${nodeId}" не найдена. Попробуйте перезайти в сцену.`;
}

function notifyNarrativeUnavailable(
  kind: NarrativeKind,
  nodeId: string,
  reason: 'missing' | 'load_failed',
  error?: unknown,
): void {
  if (reason === 'load_failed') {
    devWarn(`[narrative] Failed to load ${kind} pack for node "${nodeId}"`, error);
  } else {
    devWarn(`[narrative] ${kind} node not found: "${nodeId}"`);
  }
  dispatchStateAction({
    type: 'notification/push',
    notificationType: 'quest',
    text: userMessageForKind(kind, nodeId, reason),
  });
}

/** Wraps presentNarrativeBeat in a try-catch so errors never propagate silently. */
function safePresentNarrativeBeat(nodeId: string, kind: NarrativeKind): boolean {
  try {
    presentNarrativeBeat(nodeId, kind);
    return true;
  } catch (error) {
    notifyNarrativeUnavailable(kind, nodeId, 'load_failed', error);
    emitInteractionEndIfNeeded();
    return false;
  }
}

export async function tryOpenDialogue(nodeId: string): Promise<boolean> {
  try {
    const snapshot = getGameSnapshot();
    const resolvedId = resolveDialogueEntryNodeId(nodeId, snapshot.playerState.visitedNodes);
    await ensureDialogueNode(resolvedId);
    if (shouldAbortNarrativePresentation()) return false;
    if (getDialogueNodes()[resolvedId]) {
      safePresentNarrativeBeat(resolvedId, 'dialogue');
      return true;
    }
    notifyNarrativeUnavailable('dialogue', resolvedId, 'missing');
  } catch (error) {
    notifyNarrativeUnavailable('dialogue', nodeId, 'load_failed', error);
  }
  return false;
}

export async function tryOpenStory(nodeId: string): Promise<boolean> {
  try {
    await ensureStoryNode(nodeId);
    if (shouldAbortNarrativePresentation()) return false;
    const storyNode = getStoryNodes()[nodeId];
    if (!storyNode) {
      notifyNarrativeUnavailable('story', nodeId, 'missing');
      return false;
    }
    safePresentNarrativeBeat(nodeId, 'story');
    return true;
  } catch (error) {
    notifyNarrativeUnavailable('story', nodeId, 'load_failed', error);
  }
  return false;
}

/** Zone/object linked dialogue — includes scene transition for visited nodes. */
export async function openLinkedDialogue(nodeId: string): Promise<boolean> {
  const snapshotBefore = getGameSnapshot();
  const sceneBefore = snapshotBefore.exploration.currentSceneId;
  const resolvedId = resolveDialogueEntryNodeId(nodeId, snapshotBefore.playerState.visitedNodes);

  try {
    await ensureDialogueNode(resolvedId);
  } catch (error) {
    notifyNarrativeUnavailable('dialogue', nodeId, 'load_failed', error);
    return false;
  }
  if (shouldAbortNarrativePresentation()) return false;
  const dlgNode = getDialogueNodes()[resolvedId];
  if (!dlgNode) {
    notifyNarrativeUnavailable('dialogue', resolvedId, 'missing');
    return false;
  }

  const snapshot = getGameSnapshot();
  const sceneChanged = snapshot.exploration.currentSceneId !== sceneBefore;
  const alreadyVisited = hasVisitedNode(snapshot.playerState.visitedNodes, resolvedId);
  if (alreadyVisited && dlgNode.sceneId) {
    if (!sceneChanged) {
      requestSceneTransition(dlgNode.sceneId as SceneId);
    }
    return true;
  }

  // Mid-load scene change — presenting dialogue against a stale zone is unsafe.
  if (sceneChanged) return false;

  safePresentNarrativeBeat(resolvedId, 'dialogue');
  return true;
}

/** Zone/object linked story — includes scene transition for visited nodes. */
export async function openLinkedStory(nodeId: string): Promise<boolean> {
  // Capture the scene we're in *before* the async load.
  // After the await, we re-read the snapshot to detect mid-load scene changes.
  const snapshotBefore = getGameSnapshot();
  const sceneBefore = snapshotBefore.exploration.currentSceneId;

  try {
    await ensureStoryNode(nodeId);
  } catch (error) {
    notifyNarrativeUnavailable('story', nodeId, 'load_failed', error);
    return false;
  }

  const storyNode = getStoryNodes()[nodeId];
  if (!storyNode) {
    notifyNarrativeUnavailable('story', nodeId, 'missing');
    return false;
  }

  // ── Race #2: Re-read snapshot after async to detect mid-load scene change. ──
  // If the scene changed during the await, our pre-load scene references are stale.
  // We still proceed for same-scene cases, but skip scene-transition decisions.
  const snapshot = getGameSnapshot();
  const sceneChanged = snapshot.exploration.currentSceneId !== sceneBefore;
  const cinemaBlocking = shouldAbortNarrativePresentation();

  // Door/arrival beats — first visit plays cutscene + story; revisit walks through to hub.
  // Arrival flythrough timelines often start during ensureStoryNode; still arm/visit/set
  // the entry node so cutscene controller can start after cinema ends (do not hard-abort).
  const entryHubId = SCENE_ENTRY_NODE_TO_HUB[nodeId];
  if (cinemaBlocking && !entryHubId) return false;

  if (entryHubId && storyNode.sceneId) {
    const alreadyVisited = hasVisitedNode(snapshot.playerState.visitedNodes, nodeId);

    if (alreadyVisited) {
      dispatchStateAction({ type: 'story/visitNode', nodeId });
      if (entryHubId !== nodeId) {
        if (isClosedOverlayExploreHub(entryHubId)) {
          enterSceneFreeExplorationHub(entryHubId);
        } else {
          dispatchStateAction({ type: 'story/visitNode', nodeId: entryHubId });
          dispatchStateAction({ type: 'story/setCurrentNodeId', nodeId: entryHubId });
        }
      }
      // Race #2: only request scene transition if scene hasn't changed during await.
      if (!sceneChanged && snapshot.exploration.currentSceneId !== storyNode.sceneId) {
        requestSceneTransition(storyNode.sceneId as SceneId);
      }
      return true;
    }

    armEntryBeatFromZone(nodeId);
    dispatchStateAction({ type: 'story/visitNode', nodeId });
    // Race #2: only request scene transition if scene hasn't changed during await.
    if (!sceneChanged && snapshot.exploration.currentSceneId !== storyNode.sceneId) {
      requestSceneTransition(storyNode.sceneId as SceneId);
    }
    dispatchStateAction({ type: 'story/setCurrentNodeId', nodeId });
    // Skip VN present while arrival cinema is live — cutscene/hub path resumes after.
    if (!getCutsceneForNode(nodeId) && !cinemaBlocking) {
      safePresentNarrativeBeat(nodeId, 'story');
    }
    return true;
  }

  const alreadyVisited = hasVisitedNode(snapshot.playerState.visitedNodes, nodeId);
  if (alreadyVisited && storyNode.sceneId) {
    // Race #2: only request scene transition if scene hasn't changed during await.
    if (!sceneChanged) {
      requestSceneTransition(storyNode.sceneId as SceneId);
    }
    return true;
  }

  safePresentNarrativeBeat(nodeId, 'story');
  return true;
}

/**
 * After a physical scene transition, play door/arrival entry beats (e.g. corridor_door cutscene)
 * when the player walked through a scene exit instead of using a linked trigger zone.
 */
export function triggerSceneEntryStoryIfNeeded(
  toSceneId: SceneId,
  fromSceneId: SceneId,
): void {
  const snapshot = getGameSnapshot();
  if (snapshot.activeCutsceneId) return;

  const hubDef = getExploreHubDefForScene(toSceneId);
  if (!hubDef || hubDef.entryNodeIds.length === 0) return;

  const currentNodeId = snapshot.currentNodeId;
  const currentStorySceneId =
    currentNodeId != null ? getStoryNodeSceneId(currentNodeId) : undefined;
  if (
    currentNodeId != null &&
    !isExploreHubNode(currentNodeId) &&
    currentStorySceneId === toSceneId &&
    !hubDef.entryNodeIds.includes(currentNodeId)
  ) {
    return;
  }

  for (const entryNodeId of hubDef.entryNodeIds) {
    if (!isNaturalEntryTransition(entryNodeId, fromSceneId, toSceneId)) {
      continue;
    }

    const cutscene = getCutsceneForNode(entryNodeId);
    const cutscenePending =
      cutscene != null && !snapshot.triggeredCutscenes.includes(cutscene.id);

    if (snapshot.currentNodeId === entryNodeId) {
      const hubId = SCENE_ENTRY_NODE_TO_HUB[entryNodeId];
      if (cutscenePending) {
        closeNarrativeOverlay();
        const armedByZone = consumeEntryBeatFromZone();
        if (armedByZone === entryNodeId || isEntryBeatInFlight(entryNodeId)) {
          return;
        }
        if (hubId && hubId !== entryNodeId) {
          dispatchStateAction({ type: 'story/setCurrentNodeId', nodeId: hubId });
          queueMicrotask(() => {
            dispatchStateAction({ type: 'story/visitNode', nodeId: entryNodeId });
            dispatchStateAction({ type: 'story/setCurrentNodeId', nodeId: entryNodeId });
          });
        }
      } else if (hubId && hubId !== entryNodeId) {
        if (snapshot.activeCutsceneId) {
          dispatchStateAction({ type: 'cutscene/clear' });
          dispatchStateAction({ type: 'phase/clearGameplayFlags' });
          closeNarrativeOverlay();
        }
        if (isClosedOverlayExploreHub(hubId)) {
          enterSceneFreeExplorationHub(hubId);
        } else {
          dispatchStateAction({ type: 'story/visitNode', nodeId: hubId });
          dispatchStateAction({ type: 'story/setCurrentNodeId', nodeId: hubId });
          closeNarrativeOverlay();
        }
        markEntryBeatHubPromoted();
      }
      return;
    }

    const hubId = SCENE_ENTRY_NODE_TO_HUB[entryNodeId];
    const onHub = hubId != null && snapshot.currentNodeId === hubId;
    const visited = hasVisitedNode(snapshot.playerState.visitedNodes, entryNodeId);

    if (!visited || cutscenePending) {
      // Race #3: capture generation before the async fire-and-forget to detect
      // stale writes if a second scene transition fires before this one resolves.
      const genBefore = getEntryBeatGeneration();
      if (entryStoryInFlight) {
        devWarn('[narrative] Skipping entry story — another is already in flight');
        return;
      }
      entryStoryInFlight = true;
      void openLinkedStory(entryNodeId)
        .catch((error) => {
          devWarn('[narrative] triggerSceneEntryStoryIfNeeded failed:', entryNodeId, error);
          // If generation changed, another transition already took over — reset to avoid corruption.
          if (getEntryBeatGeneration() !== genBefore) {
            devWarn('[narrative] Entry beat generation changed during async open, resetting state');
            resetEntryBeatState();
          }
        })
        .finally(() => { entryStoryInFlight = false; });
      return;
    }

    if (hubId && !onHub) {
      if (isClosedOverlayExploreHub(hubId)) {
        enterSceneFreeExplorationHub(hubId);
      } else {
        dispatchStateAction({ type: 'story/visitNode', nodeId: hubId });
        dispatchStateAction({ type: 'story/setCurrentNodeId', nodeId: hubId });
      }
      return;
    }
  }
}
