import { useEffect } from 'react';
import { eventBus } from '@/engine/EventBus';
import {
  setCinematicHoldActive,
  setCinematicPresentationMode,
} from '@/engine/camera/cinematicPresentation';
import { useGameStore } from '@/store/gameStore';
import { readGamePhase } from '@/shared/gamePhase';

export interface CinematicNarrativePresentationOptions {
  /** Keep FP exploration camera — for diegetic HUD beats that overlay the world. */
  preserveExplorationCamera?: boolean;
}

/** Third-person cinematic hold while story/dialogue beats play (AAA title-card flow). */
export function useCinematicNarrativePresentation(
  active: boolean,
  options?: CinematicNarrativePresentationOptions,
): void {
  const preserveExplorationCamera = options?.preserveExplorationCamera ?? false;

  useEffect(() => {
    if (!active) return;

    if (!preserveExplorationCamera) {
      setCinematicPresentationMode('third_person');
      setCinematicHoldActive(true);
    }

    return () => {
      if (preserveExplorationCamera) return;

      setCinematicHoldActive(false);
      const store = useGameStore.getState();
      const inCutscene = readGamePhase(store) === 'cutscene' || store.activeCutsceneId != null;
      if (!inCutscene) {
        setCinematicPresentationMode('third_person');
        eventBus.emit('camera:recenter', {});
      }
    };
  }, [active, preserveExplorationCamera]);
}
