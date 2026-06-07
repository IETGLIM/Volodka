import { useEffect, useReducer, useRef } from 'react';
import { eventBus } from '@/engine/EventBus';
import { withHmrCleanup } from '@/shared/dev/hmrDispose';
import { CUTSCENE_TIMINGS } from '@/shared/constants/transitionTimings';
import {
  invalidateCanvasFirstFrame,
  isCanvasFirstFramePending,
} from '@/engine/canvas/canvasFirstFrameSession';
import {
  CANVAS_COMPOSITE_MODES,
  CANVAS_GAMEPLAY_MODES,
  canvasFadeOutMs,
  modeSwitchNeedsFreshCanvasFrame,
} from '@/engine/canvas/canvasTransitionPolicy';
import { devWarn } from '@/shared/utils/devLog';
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
  const modeRef = useRef(mode);
  modeRef.current = mode;

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

  const beginCanvasWait = (gen: number, warmFallback: boolean) => {
    invalidateCanvasFirstFrame();
    canvasReadyRef.current = false;
    dispatchCanvasTransition({ canvasReady: false, isTransitioning: true });
    canvasWaitGenRef.current = gen;

    fallbackTimerRef.current = setTimeout(() => {
      if (gen !== transitionGenRef.current) return;
      devWarn('[CanvasTransitionManager] Canvas first-frame timeout — forcing transition overlay off');
      canvasWaitGenRef.current = null;
      canvasReadyRef.current = true;
      dispatchCanvasTransition({ canvasReady: true });
      scheduleTransitionFadeOut(gen, canvasFadeOutMs(warmFallback));
    }, CUTSCENE_TIMINGS.CANVAS_TIMEOUT_MS);
  };

  const completeCanvasWait = (gen: number, warmPath: boolean) => {
    if (gen !== transitionGenRef.current) return;
    if (canvasWaitGenRef.current !== gen) return;

    canvasWaitGenRef.current = null;
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
    canvasReadyRef.current = true;
    dispatchCanvasTransition({ canvasReady: true });
    scheduleTransitionFadeOut(gen, canvasFadeOutMs(warmPath));
  };

  useEffect(() => {
    const scope = eventBus.createScope();

    scope.on('canvas:first-frame', () => {
      const waitGen = canvasWaitGenRef.current;

      if (waitGen !== null && transitionGenRef.current === waitGen) {
        completeCanvasWait(waitGen, false);
        return;
      }

      // Menu warmup — canvas rendered while hidden; do not mark ready during an active wait.
      if (canvasWaitGenRef.current !== null) return;

      if (modeRef.current === 'menu' || CANVAS_COMPOSITE_MODES.has(modeRef.current)) {
        canvasReadyRef.current = true;
        dispatchCanvasTransition({ canvasReady: true });
      }
    });

    scope.on('canvas:context-lost', () => {
      canvasReadyRef.current = false;
      dispatchCanvasTransition({ canvasReady: false });
      if (!CANVAS_GAMEPLAY_MODES.has(modeRef.current)) return;

      transitionGenRef.current += 1;
      const gen = transitionGenRef.current;
      clearTransitionTimers();
      beginCanvasWait(gen, false);
    });

    scope.on('canvas:invalidate-first-frame', () => {
      canvasReadyRef.current = false;
      if (canvasWaitGenRef.current !== null) {
        dispatchCanvasTransition({ canvasReady: false });
      }
    });

    return withHmrCleanup(() => scope.dispose());
  }, []);

  useEffect(() => {
    if (mode === prevModeRef.current) return;

    const prevMode = prevModeRef.current;
    prevModeRef.current = mode;

    transitionGenRef.current += 1;
    const gen = transitionGenRef.current;
    canvasWaitGenRef.current = null;
    clearTransitionTimers();

    const enteringNonComposite = !CANVAS_COMPOSITE_MODES.has(mode);

    if (enteringNonComposite) {
      if (isTransitioning) {
        scheduleTransitionFadeOut(gen, canvasFadeOutMs(true));
      }
      return clearTransitionTimers;
    }

    const needsFreshFrame = modeSwitchNeedsFreshCanvasFrame(prevMode, mode);

    if (needsFreshFrame) {
      beginCanvasWait(gen, prevMode === 'menu');

      // First-frame may have landed between invalidate and this effect (same commit).
      queueMicrotask(() => {
        if (gen !== transitionGenRef.current) return;
        if (canvasWaitGenRef.current !== gen) return;
        if (isCanvasFirstFramePending()) return;
        completeCanvasWait(gen, prevMode === 'menu');
      });

      return clearTransitionTimers;
    }

    if (CANVAS_GAMEPLAY_MODES.has(mode)) {
      canvasReadyRef.current = true;
      dispatchCanvasTransition({ canvasReady: true, isTransitioning: true });
      scheduleTransitionFadeOut(gen, canvasFadeOutMs(true));
      return clearTransitionTimers;
    }

    // intro and other composite modes without overlay
    canvasReadyRef.current = true;
    dispatchCanvasTransition({ canvasReady: true, isTransitioning: false });
    return clearTransitionTimers;
  }, [mode, isTransitioning]);

  return { canvasReady, isTransitioning };
}
