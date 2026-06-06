import { useEffect, useReducer, useRef } from 'react';
import { eventBus } from '@/engine/EventBus';
import { CUTSCENE_TIMINGS } from '@/shared/constants/transitionTimings';
import type { CanvasTransitionState } from './types';

function canvasTransitionReducer(
  prev: CanvasTransitionState,
  patch: Partial<CanvasTransitionState>,
): CanvasTransitionState {
  return { ...prev, ...patch };
}

/** Manages black overlay until WebGL canvas emits first valid frame. */
export function useCanvasTransitionManager(mode: string) {
  const [canvasTransition, dispatchCanvasTransition] = useReducer(
    canvasTransitionReducer,
    { canvasReady: false, isTransitioning: false },
  );
  const { canvasReady, isTransitioning } = canvasTransition;

  const canvasReadyRef = useRef(false);
  const prevModeRef = useRef(mode);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeOutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transitionGenRef = useRef(0);
  const canvasWaitGenRef = useRef<number | null>(null);

  const clearTransitionTimers = () => {
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
    if (fadeOutTimerRef.current) {
      clearTimeout(fadeOutTimerRef.current);
      fadeOutTimerRef.current = null;
    }
  };

  const scheduleTransitionFadeOut = (gen: number, delayMs: number) => {
    if (fadeOutTimerRef.current) {
      clearTimeout(fadeOutTimerRef.current);
      fadeOutTimerRef.current = null;
    }
    fadeOutTimerRef.current = setTimeout(() => {
      if (gen !== transitionGenRef.current) return;
      fadeOutTimerRef.current = null;
      dispatchCanvasTransition({ isTransitioning: false });
    }, delayMs);
  };

  useEffect(() => {
    const unsub = eventBus.on('canvas:first-frame', () => {
      canvasReadyRef.current = true;
      dispatchCanvasTransition({ canvasReady: true });

      const waitGen = canvasWaitGenRef.current;
      if (waitGen === null || transitionGenRef.current !== waitGen) return;

      canvasWaitGenRef.current = null;
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
      scheduleTransitionFadeOut(waitGen, 300);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (mode !== prevModeRef.current) {
      const prevMode = prevModeRef.current;
      prevModeRef.current = mode;

      transitionGenRef.current += 1;
      const gen = transitionGenRef.current;
      canvasWaitGenRef.current = null;
      clearTransitionTimers();

      if (mode !== 'exploration' && mode !== 'cutscene' && mode !== 'combat') {
        scheduleTransitionFadeOut(gen, 300);
        return clearTransitionTimers;
      }

      const isComingFromHiddenCanvas = prevMode === 'menu';
      if (isComingFromHiddenCanvas) {
        canvasReadyRef.current = false;
        dispatchCanvasTransition({ canvasReady: false });
      }

      if (canvasReadyRef.current) {
        dispatchCanvasTransition({ isTransitioning: true });
        scheduleTransitionFadeOut(gen, 300);
        return clearTransitionTimers;
      }

      canvasReadyRef.current = false;
      dispatchCanvasTransition({ canvasReady: false, isTransitioning: true });
      canvasWaitGenRef.current = gen;

      fallbackTimerRef.current = setTimeout(() => {
        if (gen !== transitionGenRef.current) return;
        console.warn('[CanvasTransitionManager] Canvas first-frame timeout — forcing transition overlay off');
        canvasWaitGenRef.current = null;
        canvasReadyRef.current = true;
        dispatchCanvasTransition({ canvasReady: true });
        scheduleTransitionFadeOut(gen, 200);
      }, CUTSCENE_TIMINGS.CANVAS_TIMEOUT_MS);

      return clearTransitionTimers;
    }
  }, [mode]);

  return { canvasReady, isTransitioning };
}
