import { useCallback, useEffect, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import { eventBus } from '@/engine/EventBus';
import { audioEngine } from '@/engine/AudioEngine';
import { getCutsceneForNode } from '@/data/cutscenes';
import { openNarrativeOverlay } from '@/engine/scene/narrativeOverlay';
import { clearGameplayPhaseFlags, readGamePhase } from '@/shared/gamePhase';

/** Watches story node changes and drives cutscene overlays + camera events. */
export function useCutsceneController(currentNodeId: string | null) {
  const cutsceneOverlayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cutsceneEndTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCutsceneTimers = useCallback(() => {
    if (cutsceneOverlayTimerRef.current) {
      clearTimeout(cutsceneOverlayTimerRef.current);
      cutsceneOverlayTimerRef.current = null;
    }
    if (cutsceneEndTimerRef.current) {
      clearTimeout(cutsceneEndTimerRef.current);
      cutsceneEndTimerRef.current = null;
    }
  }, []);

  const skipActiveCutscene = useCallback((): boolean => {
    const store = useGameStore.getState();
    if (!store.activeCutsceneId) return false;

    clearCutsceneTimers();
    store.setCutscene(null, []);
    clearGameplayPhaseFlags(store);
    eventBus.emit('cutscene:overlay_end', {});
    eventBus.emit('camera:cutscene_end', {});

    if (store.currentNodeId && store.narrativeKind) {
      openNarrativeOverlay(store.currentNodeId, store.narrativeKind);
    }
    return true;
  }, [clearCutsceneTimers]);

  useEffect(() => {
    if (!currentNodeId) return;

    const phase = readGamePhase(useGameStore.getState());
    if (phase === 'intro' || phase === 'menu') return;

    const cutscene = getCutsceneForNode(currentNodeId);
    if (!cutscene) return;

    const store = useGameStore.getState();
    if (store.triggeredCutscenes.includes(cutscene.id)) return;
    store.markCutsceneTriggered(cutscene.id);

    clearGameplayPhaseFlags(store);
    store.setCutscene(cutscene.id, cutscene.waypoints);

    eventBus.emit('camera:cutscene_start', {
      cutsceneId: cutscene.id,
      waypoints: cutscene.waypoints,
    });

    cutsceneOverlayTimerRef.current = setTimeout(() => {
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

    cutsceneEndTimerRef.current = setTimeout(() => {
      const currentStore = useGameStore.getState();
      if (currentStore.activeCutsceneId) {
        currentStore.setCutscene(null, []);
        clearGameplayPhaseFlags(currentStore);
        if (currentStore.currentNodeId && currentStore.narrativeKind) {
          openNarrativeOverlay(currentStore.currentNodeId, currentStore.narrativeKind);
        }
      }
    }, totalDuration);

    return clearCutsceneTimers;
  }, [currentNodeId, clearCutsceneTimers]);

  return { skipActiveCutscene };
}
