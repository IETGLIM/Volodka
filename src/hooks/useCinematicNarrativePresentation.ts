import { useEffect } from 'react';
import { eventBus } from '@/engine/EventBus';
import {
  setCinematicHoldActive,
  setCinematicPresentationMode,
} from '@/engine/camera/cinematicPresentation';
import { useGameStore } from '@/store/gameStore';
import { readGamePhase } from '@/shared/gamePhase';

/** Third-person cinematic hold while story/dialogue beats play (AAA title-card flow). */
export function useCinematicNarrativePresentation(active: boolean): void {
  useEffect(() => {
    if (!active) return;

    setCinematicPresentationMode('third_person');
    setCinematicHoldActive(true);

    return () => {
      setCinematicHoldActive(false);
      const store = useGameStore.getState();
      const inCutscene = readGamePhase(store) === 'cutscene' || store.activeCutsceneId != null;
      if (!inCutscene) {
        setCinematicPresentationMode('first_person');
        eventBus.emit('camera:recenter', {});
      }
    };
  }, [active]);
}
