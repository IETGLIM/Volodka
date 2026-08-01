import { useCallback, useEffect, useRef, useState } from 'react';
import { ControllerSession } from '@/engine/controller/ControllerSession';
import { useGameStore } from '@/store/gameStore';
import { useGamePrimitive } from '@/store/selectors';
import { getActiveCutsceneId } from '@/store/stores/cutsceneStore';
import { getLiveCurrentSceneId } from '@/store/stores/explorationStore';
import { getLiveGamePhase, getUIStoreState } from '@/store/stores/uiStore';
import { eventBus } from '@/engine/EventBus';
import { audioEngine } from '@/engine/AudioEngine';
import { musicEngine } from '@/engine/MusicEngine';
import { getCutsceneForNode } from '@/data/cutscenes';
import { resolveCutsceneWaypoints } from '@/engine/camera/resolveCutsceneWaypoints';
import { closeNarrativeOverlay } from '@/engine/scene/narrativeOverlay';
import { openNarrativeAfterCutscene } from '@/engine/scene/postCutsceneNarrative';
import { clearGameplayPhaseFlags } from '@/shared/gamePhase';
import type { SceneId } from '@/shared/types/game';
import {
  setCinematicHoldActive,
  setCinematicPresentationMode,
} from '@/engine/camera/cinematicPresentation';
import {
  isEntryBeatInFlight,
  markEntryBeatCutscenePlaying,
  markEntryBeatHubPromoted,
} from '@/engine/interaction/entryBeatState';
import { SCENE_ENTRY_NODE_TO_HUB } from '@/shared/sceneExploreHubRegistry';
import { isSceneTransitionInProgress } from '@/engine/core/sceneTransitionGuard';
import {
  isCinematicTimelineActive,
  skipCinematicTimeline,
  startCinematicTimeline,
} from '@/engine/cinematic/cinematicTimelineOrchestrator';
import { cutsceneDefToTimeline } from '@/engine/cinematic/cutsceneToTimeline';
import { INTRO_WAKE_TIMELINE } from '@/engine/cinematic/introWakeTimeline';

/** Watches story node changes and drives cutscenes via the unified timeline orchestrator. */
export function useCutsceneController() {
  const currentNodeId = useGamePrimitive((s) => s.currentNodeId);
  const currentSceneId = useGamePrimitive((s) => s.exploration?.currentSceneId);
  const cutsceneSessionRef = useRef(new ControllerSession());
  /** Bumps when a cinematic timeline ends so deferred story cutscenes can retry. */
  const [timelineGateTick, setTimelineGateTick] = useState(0);

  useEffect(() => {
    const bump = () => setTimelineGateTick((n) => n + 1);
    const unsubs = [
      eventBus.on('cinematic:timeline_complete', bump),
      eventBus.on('cinematic:timeline_stop', bump),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  const cancelCutsceneSession = useCallback(() => {
    cutsceneSessionRef.current.cancel();
  }, []);

  const skipActiveCutscene = useCallback((): boolean => {
    const store = useGameStore.getState();
    // Live cutscene slice — facade can lag one rAF after New Game setCutscene.
    const activeId = getActiveCutsceneId();

    // Intro wake owns the unified timeline. Escape before the runner starts
    // (canvas:first-frame + poll gap) used to clear activeCutsceneId without
    // finishIntroWake — no woke_up, no quests, no prologue. Force skipMotion
    // start so finishIntroWake still runs.
    if (activeId === 'intro_wakeup') {
      if (isCinematicTimelineActive()) {
        skipCinematicTimeline();
      } else {
        startCinematicTimeline({
          def: INTRO_WAKE_TIMELINE,
          options: { skipMotion: true },
        });
      }
      return true;
    }

    // Story cutscenes and splash timelines share one orchestrator skip path.
    if (isCinematicTimelineActive()) {
      skipCinematicTimeline();
      return true;
    }

    if (!activeId) return false;

    cancelCutsceneSession();
    store.markCutsceneTriggered(activeId);
    store.setCutscene(null, []);
    clearGameplayPhaseFlags(store);
    eventBus.emit('cutscene:overlay_end', {});
    eventBus.emit('camera:cutscene_end', {});
    setCinematicHoldActive(false);
    setCinematicPresentationMode('third_person');
    eventBus.emit('camera:recenter', {});
    // Legacy skip (no active timeline) — restore duck the orchestrator would have.
    musicEngine.setMusicDuckFactor(1.0, 1.0);

    const ui = getUIStoreState();
    if (ui.currentNodeId && ui.narrativeKind) {
      openNarrativeAfterCutscene(ui.currentNodeId, ui.narrativeKind);
    }
    return true;
  }, [cancelCutsceneSession]);

  useEffect(() => {
    const session = cutsceneSessionRef.current;
    return () => {
      session.dispose();
    };
  }, []);

  useEffect(() => {
    if (!currentNodeId) return;

    const phase = getLiveGamePhase();
    if (phase === 'intro' || phase === 'menu') return;

    const cutscene = getCutsceneForNode(currentNodeId);
    if (!cutscene) return;

    const store = useGameStore.getState();
    if (store.triggeredCutscenes.includes(cutscene.id)) return;

    // Scene-id effect re-runs must not restart while a cutscene is already live
    // (same or different id, including intro wakeup) — otherwise overlays/waypoints double-fire.
    // Live slice: New Game sets intro_wakeup before the facade catches up.
    if (getActiveCutsceneId()) return;

    // Guard against starting a story cutscene while a unified cinematic
    // timeline is still active (e.g., a splash timeline still running).
    if (isCinematicTimelineActive()) return;

    // Scene transition race guard: if a story choice has both `transitionScene`
    // AND `next` pointing to a cutscene trigger node, executeStoryChoice sets
    // currentNodeId synchronously THEN fires requestSceneTransition. Without
    // this guard, the cutscene would start in the OLD scene with waypoints
    // designed for the NEW scene. Defer until the target scene is loaded.
    if (isSceneTransitionInProgress()) return;

    const beatNodeId = currentNodeId;
    const generation = cutsceneSessionRef.current.begin();

    markEntryBeatCutscenePlaying(beatNodeId);

    closeNarrativeOverlay();

    if (!store.narrativeKind) {
      store.setNarrativeKind('story');
    }

    clearGameplayPhaseFlags(store);
    setCinematicPresentationMode('third_person');

    const playbackSceneId = getLiveCurrentSceneId() as SceneId;
    const resolvedWaypoints = resolveCutsceneWaypoints(cutscene, playbackSceneId);
    const timeline = cutsceneDefToTimeline({ ...cutscene, waypoints: resolvedWaypoints });

    store.setCutscene(cutscene.id, resolvedWaypoints);

    // Single playback path: timeline orchestrator + CinematicTimelineRunner
    // (camera + overlay). Legacy camera:cutscene_* remains for skip fallback
    // and any non-timeline consumers.
    startCinematicTimeline({ def: timeline });

    if (cutscene.type === 'revelation') {
      audioEngine.playStinger('discovery');
    } else if (cutscene.type === 'character_intro') {
      audioEngine.playStinger('emotional');
    } else {
      audioEngine.playStinger('mystery');
    }

    let finished = false;
    let unsubOverlayEnd: (() => void) | null = null;
    let unsubTimelineComplete: (() => void) | null = null;

    const finishCutsceneBeat = () => {
      if (finished || !cutsceneSessionRef.current.isCurrent(generation)) return;
      finished = true;
      unsubOverlayEnd?.();
      unsubTimelineComplete?.();

      const currentStore = useGameStore.getState();
      if (getActiveCutsceneId()) {
        currentStore.markCutsceneTriggered(cutscene.id);
        currentStore.setCutscene(null, []);
        clearGameplayPhaseFlags(currentStore);
        setCinematicHoldActive(false);
        setCinematicPresentationMode('third_person');
        // Timeline orchestrator already restores music + emits overlay_end /
        // camera:recenter; emit cutscene_end for any legacy camera listeners.
        eventBus.emit('camera:cutscene_end', {});
      }
      const ui = getUIStoreState();
      if (ui.currentNodeId) {
        const nodeId = ui.currentNodeId;
        const kind = ui.narrativeKind ?? 'story';
        const hubId = SCENE_ENTRY_NODE_TO_HUB[nodeId];
        if (hubId && hubId !== nodeId) {
          markEntryBeatHubPromoted();
        }
        queueMicrotask(() => {
          if (!cutsceneSessionRef.current.isCurrent(generation)) return;
          openNarrativeAfterCutscene(nodeId, kind);
        });
      }
    };

    // Orchestrator emits overlay_end on complete/stop; also listen for
    // timeline_complete so skipMotion / orphan-watchdog paths still finish.
    unsubOverlayEnd = eventBus.on('cutscene:overlay_end', finishCutsceneBeat);
    unsubTimelineComplete = eventBus.on('cinematic:timeline_complete', ({ timelineId }) => {
      if (timelineId === timeline.id) finishCutsceneBeat();
    });

    // Safety fallback if neither complete nor overlay_end fires.
    cutsceneSessionRef.current.schedule(
      finishCutsceneBeat,
      (timeline.fallbackMs ?? cutscene.textDurationMs + 5000) + 5000,
    );

    const session = cutsceneSessionRef.current;

    return () => {
      unsubOverlayEnd?.();
      unsubTimelineComplete?.();
      const hubId = SCENE_ENTRY_NODE_TO_HUB[beatNodeId];
      const nextNodeId = getUIStoreState().currentNodeId;
      // Entry beat hub promotion (corridor_door → corridor_explore_mode) must not cancel in-flight cutscene.
      if (hubId && nextNodeId === hubId && isEntryBeatInFlight(beatNodeId)) {
        return;
      }
      if (isEntryBeatInFlight(beatNodeId) && nextNodeId === beatNodeId) {
        return;
      }
      session.cancel();
    };
  }, [currentNodeId, currentSceneId, timelineGateTick]);

  return { skipActiveCutscene };
}
