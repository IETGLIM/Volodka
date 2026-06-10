import { useState, useEffect, useRef } from 'react';
import { eventBus } from '@/engine/EventBus';
import { markFirstFrame } from '@/engine/performance/LoadingTimeline';

/** Manages canvas ready state and scene transitions. */
export function useCanvasTransitionManager(mode: string) {
  const [canvasReady, setCanvasReady] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [fadeOutMs, setFadeOutMs] = useState(0);
  const transitionGenerationRef = useRef(0);

  useEffect(() => {
    const unsub = eventBus.on('canvas:first-frame', () => {
      setCanvasReady(true);
      markFirstFrame();
    });

    const unsub2 = eventBus.on('scene:transition', () => {
      transitionGenerationRef.current += 1;
      const generation = transitionGenerationRef.current;
      setIsTransitioning(true);
      setFadeOutMs(500);

      setTimeout(() => {
        if (transitionGenerationRef.current === generation) {
          setIsTransitioning(false);
        }
      }, 500);
    });

    const unsub3 = eventBus.on('scene:loaded', () => {
      setIsTransitioning(false);
    });

    return () => {
      unsub();
      unsub2();
      unsub3();
    };
  }, []);

  return { canvasReady, isTransitioning, fadeOutMs };
}
