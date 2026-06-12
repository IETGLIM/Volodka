import { useCallback, useEffect, useRef } from 'react';
import { ControllerSession } from '@/engine/controller/ControllerSession';
import { useGameStore } from '@/store/gameStore';
import { useGamePrimitive } from '@/store/selectors';
import { eventBus } from '@/engine/EventBus';
import { audioEngine } from '@/engine/AudioEngine';
import { getCutsceneForNode } from '@/data/cutscenes';
import { openNarrativeOverlay } from '@/engine/scene/narrativeOverlay';
import { clearGameplayPhaseFlags, readGamePhase } from '@/shared/gamePhase';
import {
  isIntroWakeupCutscene,
  setCinematicPresentationMode,
} from '@/engine/camera/cinematicPresentation';

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
    store.setCutscene(null, []);
    clearGameplayPhaseFlags(store);
    eventBus.emit('cutscene:overlay_end', {});
    eventBus.emit('camera:cutscene_end', {});
    setCinematicPresentationMode('first_person');
    eventBus.emit('camera:recenter', {});

    if (store.currentNodeId && store.narrativeKind) {
      openNarrativeOverlay(store.currentNodeId, store.narrativeKind);
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

    const generation = cutsceneSessionRef.current.begin();

    if (!store.narrativeKind) {
      store.setNarrativeKind('story');
    }

    store.markCutsceneTriggered(cutscene.id);

    clearGameplayPhaseFlags(store);
    setCinematicPresentationMode('third_person');
    store.setCutscene(cutscene.id, cutscene.waypoints);

    eventBus.emit('camera:cutscene_start', {
      cutsceneId: cutscene.id,
      waypoints: cutscene.waypoints,
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

    cutsceneSessionRef.current.schedule(() => {
      const currentStore = useGameStore.getState();
      if (!cutsceneSessionRef.current.isCurrent(generation)) return;
      if (currentStore.activeCutsceneId) {
        currentStore.setCutscene(null, []);
        clearGameplayPhaseFlags(currentStore);
        setCinematicPresentationMode('first_person');
        eventBus.emit('cutscene:overlay_end', {});
        eventBus.emit('camera:cutscene_end', {});
        if (currentStore.currentNodeId && currentStore.narrativeKind) {
          openNarrativeOverlay(currentStore.currentNodeId, currentStore.narrativeKind);
        }
      }
    }, totalDuration);
  }, [currentNodeId]);

  return { skipActiveCutscene };
}
