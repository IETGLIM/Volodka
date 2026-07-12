import { useState, useEffect, useRef } from 'react';
import { eventBus } from '@/engine/EventBus';
import { markFirstFrame } from '@/engine/performance/LoadingTimeline';
import { CANVAS_SCENE_FADE_MS } from '@/shared/constants/transitionTimings';
import { useTransitionDirector } from '@/hooks/useTransitionDirector';

/** Manages canvas ready state and scene transitions. */
export function useCanvasTransitionManager(_mode: string) {
  const [canvasReady, setCanvasReady] = useState(false);
  const transitionGenerationRef = useRef(0);
  const { isCanvasFading, phase } = useTransitionDirector();

  useEffect(() => {
    const unsub = eventBus.on('canvas:first-frame', () => {
      setCanvasReady(true);
      markFirstFrame();
    });

    const unsub3 = eventBus.on('scene:loaded', () => {
      transitionGenerationRef.current += 1;
    });

    return () => {
      unsub();
      unsub3();
    };
  }, []);

  const isTransitioning = isCanvasFading && phase !== 'idle';
  const fadeOutMs = CANVAS_SCENE_FADE_MS;

  return { canvasReady, isTransitioning, fadeOutMs };
}
