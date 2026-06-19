import { useCallback, useEffect, useRef } from 'react';
import { ControllerSession } from '@/engine/controller/ControllerSession';
import { useGameStore } from '@/store/gameStore';
import { useGamePrimitive } from '@/store/selectors';
import { eventBus } from '@/engine/EventBus';
import { audioEngine } from '@/engine/AudioEngine';
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

/** Watches story node changes and drives cutscene overlays + camera events. */
export function useCutsceneController() {
  const currentNodeId = useGamePrimitive((s) => s.currentNodeId);
  const cutsceneSessionRef = useRef(new ControllerSession());

  const cancelCutsceneSession = useCallback(() => {
    cutsceneSessionRef.current.cancel();
  }, []);

  const skipActiveCutscene = useCallback((): boolean => {
    const store = useGameStore.getState();
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

    cutsceneSessionRef.current.schedule(() => {
      eventBus.emit('cutscene:overlay', {
        text: cutscene.textOverlay,
        subtitle: cutscene.subtitle,
        accentColor: cutscene.textAccentColor,
        durationMs: cutscene.textDurationMs,
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

    const totalDuration = cutscene.textDurationMs + 2000;
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
      cutsceneSessionRef.current.cancel();
    };
  }, [currentNodeId]);

  return { skipActiveCutscene };
}
