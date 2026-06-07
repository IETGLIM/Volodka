import { useEffect, useState, useSyncExternalStore } from 'react';
import { withHmrCleanup } from '@/shared/dev/hmrDispose';
import {
  CanvasTransitionController,
  INITIAL_CANVAS_TRANSITION,
  type CanvasTransitionSnapshot,
} from '@/engine/canvas/CanvasTransitionController';

/** Manages black overlay until WebGL canvas emits first valid frame. */
export function useCanvasTransitionManager(mode: string) {
  const [store] = useState(() => {
    let snapshot = INITIAL_CANVAS_TRANSITION;
    const listeners = new Set<() => void>();

    const controller = new CanvasTransitionController((next) => {
      snapshot = next;
      for (const listener of listeners) listener();
    });

    return {
      controller,
      subscribe(listener: () => void) {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
      getSnapshot: () => snapshot,
    };
  });

  const snapshot = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
  );

  useEffect(() => {
    const disposeEvents = store.controller.bindEvents();
    return withHmrCleanup(() => {
      disposeEvents();
      store.controller.dispose();
    });
  }, [store]);

  useEffect(() => {
    store.controller.setMode(mode);
  }, [mode, store]);

  return snapshot satisfies CanvasTransitionSnapshot;
}
