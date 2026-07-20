import { useCallback, useEffect, useRef } from 'react';
import { ControllerSession } from '@/engine/controller/ControllerSession';
import { useGameStore } from '@/store/gameStore';
import { useGamePrimitive } from '@/store/selectors';
import { eventBus } from '@/engine/EventBus';
import { audioEngine } from '@/engine/AudioEngine';
import { musicEngine } from '@/engine/MusicEngine';
import { getCutsceneForNode } from '@/data/cutscenes';
import { resolveCutsceneWaypoints } from '@/engine/camera/resolveCutsceneWaypoints';
import { closeNarrativeOverlay } from '@/engine/scene/narrativeOverlay';
import { openNarrativeAfterCutscene } from '@/engine/scene/postCutsceneNarrative';
import { clearGameplayPhaseFlags, readGamePhase } from '@/shared/gamePhase';
import type { SceneId } from '@/shared/types/game';
import {
  isIntroWakeupCutscene,
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
} from '@/engine/cinematic/cinematicTimelineOrchestrator';

/** Watches story node changes and drives cutscene overlays + camera events. */
export function useCutsceneController() {
  const currentNodeId = useGamePrimitive((s) => s.currentNodeId);
  const currentSceneId = useGamePrimitive((s) => s.exploration?.currentSceneId);
  const cutsceneSessionRef = useRef(new ControllerSession());

  const cancelCutsceneSession = useCallback(() => {
    cutsceneSessionRef.current.cancel();
  }, []);

  const skipActiveCutscene = useCallback((): boolean => {
    const store = useGameStore.getState();

    // If a unified cinematic timeline is driving this cutscene (e.g.
    // `intro_wakeup`), defer to the timeline orchestrator's skip path.
    // Otherwise we would clear the store state here, call
    // e.stopImmediatePropagation() in the keyboard manager, and BLOCK the
    // IntroWakeOverlay's ESC listener (which emits `intro:wakeup_skip`) —
    // leaving the timeline running for ~29s with no overlay and no player
    // control. The orchestrator emits `cinematic:timeline_skip` → runner's
    // onSkip → completeCinematicTimeline(id, true) → onSkippedComplete →
    // finishIntroWake, which performs full camera/avatar/state cleanup.
    if (isCinematicTimelineActive()) {
      skipCinematicTimeline();
      return true;
    }

    if (!store.activeCutsceneId) return false;

    cancelCutsceneSession();
    store.markCutsceneTriggered(store.activeCutsceneId!);
    store.setCutscene(null, []);
    clearGameplayPhaseFlags(store);
    eventBus.emit('cutscene:overlay_end', {});
    eventBus.emit('camera:cutscene_end', {});
    setCinematicHoldActive(false);
    setCinematicPresentationMode('third_person');
    eventBus.emit('camera:recenter', {});
    // Restore music volume to 100% over 1.0s — the normal finishCutsceneBeat
    // path does this, but skipActiveCutscene bypasses that path (cancelCutsceneSession
    // invalidates the generation, so finishCutsceneBeat's isCurrent() guard rejects
    // the overlay_end callback). Without this, music would stay ducked at 30%
    // until the next cutscene completes normally.
    musicEngine.setMusicDuckFactor(1.0, 1.0);

    if (store.currentNodeId && store.narrativeKind) {
      openNarrativeAfterCutscene(store.currentNodeId, store.narrativeKind);
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

    const phase = readGamePhase(useGameStore.getState());
    if (phase === 'intro' || phase === 'menu') return;

    const cutscene = getCutsceneForNode(currentNodeId);
    if (!cutscene) return;

    const store = useGameStore.getState();
    if (store.triggeredCutscenes.includes(cutscene.id)) return;

    // Wake-up owns its own camera + avatar — do not replace with story title cards.
    if (isIntroWakeupCutscene(store.activeCutsceneId)) return;

    // Guard against starting a story cutscene while a unified cinematic
    // timeline is still active (e.g., a splash timeline still running).
    // Without this, overlays stack and music duck factor is applied twice.
    if (isCinematicTimelineActive()) return;

    // Scene transition race guard: if a story choice has both `transitionScene`
    // AND `next` pointing to a cutscene trigger node, executeStoryChoice sets
    // currentNodeId synchronously THEN fires requestSceneTransition. Without
    // this guard, the cutscene would start in the OLD scene with waypoints
    // designed for the NEW scene, producing a broken camera. Defer until the
    // target scene is loaded — the effect re-fires when currentSceneId
    // changes (added as a dependency below).
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

    const playbackSceneId = store.exploration.currentSceneId as SceneId;
    const resolvedWaypoints = resolveCutsceneWaypoints(cutscene, playbackSceneId);

    store.setCutscene(cutscene.id, resolvedWaypoints);

    eventBus.emit('camera:cutscene_start', {
      cutsceneId: cutscene.id,
      waypoints: resolvedWaypoints,
    });

    // Compute the total camera animation duration from waypoint durations (in
    // seconds → ms). The overlay's auto-dismiss timer must NOT fire before the
    // camera finishes its waypoint sequence, otherwise the camera is cut short
    // and never reaches its final dramatic position. Add 800ms grace so the
    // final frame holds briefly before the overlay fades.
    const waypointSumMs = resolvedWaypoints.reduce(
      (sum, w) => sum + Math.max(0, w.duration) * 1000,
      0,
    );
    const displayDurationMs = Math.max(
      cutscene.textDurationMs,
      waypointSumMs + 800,
    );

    cutsceneSessionRef.current.schedule(() => {
      eventBus.emit('cutscene:overlay', {
        text: cutscene.textOverlay,
        subtitle: cutscene.subtitle,
        accentColor: cutscene.textAccentColor,
        durationMs: displayDurationMs,
        type: cutscene.type,
        letterboxStyle: cutscene.letterboxStyle,
        showEmbers: cutscene.showEmbers,
        glitchIntensity: cutscene.glitchIntensity,
      });
    }, 800);

    if (cutscene.type === 'revelation') {
      audioEngine.playStinger('discovery');
    } else if (cutscene.type === 'character_intro') {
      audioEngine.playStinger('emotional');
    } else {
      audioEngine.playStinger('mystery');
    }

    // Duck music to 30% over 0.5s for cinematic focus (consistent with the
    // unified timeline orchestrator's behaviour for intro_wakeup).
    musicEngine.setMusicDuckFactor(0.3, 0.5);

    const totalDuration = displayDurationMs + 2000;
    let finished = false;
    let unsubOverlayEnd: (() => void) | null = null;

    const finishCutsceneBeat = () => {
      if (finished || !cutsceneSessionRef.current.isCurrent(generation)) return;
      finished = true;
      unsubOverlayEnd?.();

      const currentStore = useGameStore.getState();
      if (currentStore.activeCutsceneId) {
        currentStore.markCutsceneTriggered(cutscene.id);
        currentStore.setCutscene(null, []);
        clearGameplayPhaseFlags(currentStore);
        setCinematicHoldActive(false);
        setCinematicPresentationMode('third_person');
        eventBus.emit('camera:cutscene_end', {});
        eventBus.emit('camera:recenter', {});
        // Restore music volume to 100% over 1.0s.
        musicEngine.setMusicDuckFactor(1.0, 1.0);
      }
      if (currentStore.currentNodeId) {
        const nodeId = currentStore.currentNodeId;
        const kind = currentStore.narrativeKind ?? 'story';
        const hubId = SCENE_ENTRY_NODE_TO_HUB[nodeId];
        if (hubId && hubId !== nodeId) {
          markEntryBeatHubPromoted();
        }
        // Defer until cutscene store + overlay teardown completes (avoids race with VN).
        queueMicrotask(() => {
          if (!cutsceneSessionRef.current.isCurrent(generation)) return;
          openNarrativeAfterCutscene(nodeId, kind);
        });
      }
    };

    unsubOverlayEnd = eventBus.on('cutscene:overlay_end', finishCutsceneBeat);

    // Safety fallback if overlay_end never fires (stuck overlay).
    cutsceneSessionRef.current.schedule(finishCutsceneBeat, totalDuration + 5000);

    // Capture the session ref so the cleanup uses the same instance that was
    // scheduled, not whatever the ref points to by the time cleanup runs.
    const session = cutsceneSessionRef.current;

    return () => {
      unsubOverlayEnd?.();
      const hubId = SCENE_ENTRY_NODE_TO_HUB[beatNodeId];
      const nextNodeId = useGameStore.getState().currentNodeId;
      // Entry beat hub promotion (corridor_door → corridor_explore_mode) must not cancel in-flight cutscene.
      if (hubId && nextNodeId === hubId && isEntryBeatInFlight(beatNodeId)) {
        return;
      }
      if (isEntryBeatInFlight(beatNodeId) && nextNodeId === beatNodeId) {
        return;
      }
      session.cancel();
    };
  }, [currentNodeId, currentSceneId]);

  return { skipActiveCutscene };
}
