import { useEffect, useRef } from 'react';
import { shallow } from 'zustand/shallow';
import { useGameStore } from '@/store/gameStore';
import { eventBus } from '@/engine/EventBus';
import { triggerCameraShake } from '@/engine/camera/cameraShake';
import { getSceneAudioController } from '@/engine/audio/SceneAudioController';
import type { SceneId } from '@/config/sceneDefinitions';

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

    const state = useGameStore.getState();
    ctrl.onModeChange(
      state.mode,
      state.exploration.currentSceneId as SceneId,
      state.exploration.timeOfDay,
      state.showStoryOverlay,
    );

    return () => {
      disposedRef.current = true;
    };
  }, []);

  useEffect(() => {
    const ctrl = controllerRef.current;
    const unsubs: (() => void)[] = [];

    unsubs.push(
      eventBus.on('poem:collected', ({ poemId }) => {
        if (disposedRef.current) return;
        ctrl.onPoemCollected(poemId);
      }),
    );

    unsubs.push(
      eventBus.on('combat:start', () => {
        if (disposedRef.current) return;
        ctrl.onCombatStart();
      }),
    );

    unsubs.push(
      eventBus.on('combat:end', () => {
        if (disposedRef.current) return;
        const state = useGameStore.getState();
        ctrl.onCombatEnd(
          state.exploration.currentSceneId as SceneId,
          state.exploration.timeOfDay,
        );
      }),
    );

    unsubs.push(
      eventBus.on('quest:accepted', () => {
        if (disposedRef.current) return;
        ctrl.onQuestAccepted();
      }),
    );

    unsubs.push(
      eventBus.on('scene:enter', ({ sceneId }) => {
        if (disposedRef.current) return;
        const timeOfDay = useGameStore.getState().exploration.timeOfDay;
        ctrl.onSceneEnter(sceneId as SceneId, timeOfDay);
      }),
    );

    unsubs.push(
      eventBus.on('fx:glitch', () => {
        triggerCameraShake(0.05, 8);
      }),
    );

    unsubs.push(
      eventBus.on('scene:enter', () => {
        triggerCameraShake(0.03, 3);
      }),
    );

    return () => unsubs.forEach((u) => u());
  }, []);

  useEffect(() => {
    const ctrl = controllerRef.current;
    const unsub = useGameStore.subscribe(
      (state) => ({
        mode: state.mode,
        showStoryOverlay: state.showStoryOverlay,
        sceneId: state.exploration.currentSceneId,
        timeOfDay: state.exploration.timeOfDay,
      }),
      (selected, prev) => {
        if (disposedRef.current) return;

        if (selected.mode !== prev.mode) {
          ctrl.onModeChange(
            selected.mode,
            selected.sceneId as SceneId,
            selected.timeOfDay,
            selected.showStoryOverlay,
          );
        } else {
          if (selected.showStoryOverlay !== prev.showStoryOverlay) {
            ctrl.setDialogueState(selected.showStoryOverlay, selected.mode);
          }
          if (selected.mode === 'combat' || prev.mode === 'combat') {
            ctrl.onModeChange(
              selected.mode,
              selected.sceneId as SceneId,
              selected.timeOfDay,
              selected.showStoryOverlay,
            );
          }
        }

        if (
          selected.mode === 'exploration' &&
          selected.sceneId !== prev.sceneId
        ) {
          ctrl.onSceneEnter(selected.sceneId as SceneId, selected.timeOfDay);
        }

        if (
          selected.mode === 'exploration' &&
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
    return unsub;
  }, []);
}
