import { useCallback, useEffect, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import { eventBus } from '@/engine/EventBus';
import { audioEngine } from '@/engine/AudioEngine';
import { STORY_NODES } from '@/data/storyNodes';
import { DIALOGUE_NODES } from '@/data/dialogueNodes';
import { getCutsceneForNode } from '@/data/cutscenes';
import { openNarrativeOverlay } from '@/engine/scene/narrativeOverlay';

/** Watches story node changes and drives cutscene mode + camera events. */
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
    if (store.mode !== 'cutscene') return false;

    clearCutsceneTimers();
    store.setCutscene(null, []);
    store.setMode('exploration');
    eventBus.emit('cutscene:overlay_end', {});
    eventBus.emit('camera:cutscene_end', {});

    if (store.currentNodeId && STORY_NODES[store.currentNodeId]) {
      openNarrativeOverlay(store.currentNodeId);
    }
    return true;
  }, [clearCutsceneTimers]);

  useEffect(() => {
    if (!currentNodeId) return;

    const currentMode = useGameStore.getState().mode;
    if (currentMode === 'intro' || currentMode === 'menu') return;

    const cutscene = getCutsceneForNode(currentNodeId);
    if (!cutscene) return;

    const store = useGameStore.getState();
    if (store.triggeredCutscenes.includes(cutscene.id)) return;
    store.markCutsceneTriggered(cutscene.id);

    store.setMode('cutscene');
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
      if (currentStore.mode === 'cutscene') {
        currentStore.setCutscene(null, []);
        currentStore.setMode('exploration');
        if (
          currentStore.currentNodeId &&
          (STORY_NODES[currentStore.currentNodeId] || DIALOGUE_NODES[currentStore.currentNodeId])
        ) {
          openNarrativeOverlay(currentStore.currentNodeId);
        }
      }
    }, totalDuration);

    return clearCutsceneTimers;
  }, [currentNodeId, clearCutsceneTimers]);

  return { skipActiveCutscene };
}
