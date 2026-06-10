import { useEffect, useRef } from 'react';
import { shallow } from 'zustand/shallow';
import { useGameStore } from '@/store/gameStore';
import { eventBus, EventBusPriority } from '@/engine/EventBus';
import { withHmrCleanup } from '@/shared/dev/hmrDispose';
import { triggerCameraShake } from '@/engine/camera/cameraShake';
import { getSceneAudioController } from '@/engine/audio/SceneAudioController';
import { getGamePhase } from '@/shared/gamePhase';
import type { SceneId } from '@/config/sceneDefinitions';

function selectAudioPhase(state: ReturnType<typeof useGameStore.getState>) {
  return getGamePhase({
    mainMenuOpen: state.mainMenuOpen,
    introActive: state.introActive,
    combatActive: state.combatActive,
    activeCutsceneId: state.activeCutsceneId,
  });
}

function syncAudioFromStore(ctrl: ReturnType<typeof getSceneAudioController>): void {
  const state = useGameStore.getState();
  ctrl.onModeChange(
    selectAudioPhase(state),
    state.exploration.currentSceneId as SceneId,
    state.exploration.timeOfDay,
    state.showStoryOverlay,
  );
}

/**
 * Thin React hook — subscribes to game state / EventBus and delegates
 * all audio decisions to SceneAudioController.
 */
export function useAudioOrchestrator() {
  const controllerRef = useRef(getSceneAudioController());
  const disposedRef = useRef(false);

  useEffect(() => {
    disposedRef.current = false;
    const ctrl = controllerRef.current;
    ctrl.init();

    syncAudioFromStore(ctrl);

    return withHmrCleanup(() => {
      disposedRef.current = true;
      ctrl.dispose();
    });
  }, []);

  useEffect(() => {
    const ctrl = controllerRef.current;
    const scope = eventBus.createScope();

    scope.on('poem:collected', ({ poemId }) => {
      if (disposedRef.current) return;
      ctrl.onPoemCollected(poemId);
    });

    scope.on('combat:start', () => {
      if (disposedRef.current) return;
      ctrl.onCombatStart();
    }, EventBusPriority.FX);

    scope.on('combat:end', () => {
      if (disposedRef.current) return;
      const state = useGameStore.getState();
      ctrl.onCombatEnd(
        state.exploration.currentSceneId as SceneId,
        state.exploration.timeOfDay,
      );
    }, EventBusPriority.FX);

    scope.on('quest:accepted', () => {
      if (disposedRef.current) return;
      ctrl.onQuestAccepted();
    });

    scope.on('scene:unload', () => {
      if (disposedRef.current) return;
      ctrl.onSceneUnload();
    });

    scope.on('scene:enter', ({ sceneId }) => {
      if (disposedRef.current) return;
      const timeOfDay = useGameStore.getState().exploration.timeOfDay;
      ctrl.onSceneEnter(sceneId as SceneId, timeOfDay);
      triggerCameraShake(0.03, 3);
    });

    scope.on('game:loaded', () => {
      if (disposedRef.current) return;
      syncAudioFromStore(ctrl);
    });

    scope.on('fx:glitch', () => {
      triggerCameraShake(0.05, 8);
    });

    return withHmrCleanup(() => scope.dispose());
  }, []);

  useEffect(() => {
    const ctrl = controllerRef.current;
    const unsub = useGameStore.subscribe(
      (state) => ({
        phase: selectAudioPhase(state),
        showStoryOverlay: state.showStoryOverlay,
        sceneId: state.exploration.currentSceneId,
        timeOfDay: state.exploration.timeOfDay,
      }),
      (selected, prev) => {
        if (disposedRef.current) return;

        if (selected.phase !== prev.phase) {
          ctrl.onModeChange(
            selected.phase,
            selected.sceneId as SceneId,
            selected.timeOfDay,
            selected.showStoryOverlay,
          );
        } else {
          if (selected.showStoryOverlay !== prev.showStoryOverlay) {
            ctrl.setDialogueState(selected.showStoryOverlay, selected.phase);
          }
          if (selected.phase === 'combat' || prev.phase === 'combat') {
            ctrl.onModeChange(
              selected.phase,
              selected.sceneId as SceneId,
              selected.timeOfDay,
              selected.showStoryOverlay,
            );
          }
        }

        if (
          selected.phase === 'exploration' &&
          selected.timeOfDay !== prev.timeOfDay
        ) {
          const prevTime = prev.timeOfDay;
          const currTime = selected.timeOfDay;
          const crossedBoundary =
            (prevTime < 6 && currTime >= 6) ||
            (prevTime < 20 && currTime >= 20) ||
            (prevTime >= 6 && currTime < 6) ||
            (prevTime >= 20 && currTime < 20);

          if (crossedBoundary) {
            ctrl.onTimeOfDayBoundary(
              selected.sceneId as SceneId,
              currTime,
            );
          }
        }
      },
      { equalityFn: shallow },
    );
    return withHmrCleanup(unsub);
  }, []);
}
