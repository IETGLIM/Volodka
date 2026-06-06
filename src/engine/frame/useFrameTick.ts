import { useEffect, useRef } from 'react';
import {
  registerFrameTick,
  setFrameTickEnabled,
  unregisterFrameTick,
} from './FrameBudgetRegistry';
import type { FrameSystemId, FrameTickCallback, FrameTickOptions } from './types';

/**
 * Register a per-frame callback into the central frame budget runner.
 * Drop-in replacement for raw `useFrame` — enables system-level CPU profiling.
 */
export function useFrameTick(
  system: FrameSystemId,
  callback: FrameTickCallback,
  options: FrameTickOptions = {},
): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const { priority = 0, label, enabled = true } = options;
  const tickIdRef = useRef<number | null>(null);

  useEffect(() => {
    const id = registerFrameTick(
      system,
      (ctx) => callbackRef.current(ctx),
      { priority, label, enabled },
    );
    tickIdRef.current = id;
    return () => {
      unregisterFrameTick(id);
      tickIdRef.current = null;
    };
  }, [system, priority, label]);

  useEffect(() => {
    if (tickIdRef.current != null) {
      setFrameTickEnabled(tickIdRef.current, enabled);
    }
  }, [enabled]);
}
