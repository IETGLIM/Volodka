import { useEffect, useRef } from 'react';
import {
  registerFrameTick,
  setFrameTickEnabled,
  unregisterFrameTick,
} from './FrameBudgetRegistry';
import type { FrameSystemId, FrameTickCallback, FrameTickOptions } from './types';

/** Register a per-frame callback in the central budget runner (pre- or post-render). */
export function useFrameTick(
  system: FrameSystemId,
  callback: FrameTickCallback,
  options: FrameTickOptions = {},
): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const { priority = 0, label, enabled = true, phase = 'pre', critical } = options;
  const tickIdRef = useRef<number | null>(null);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  useEffect(() => {
    const id = registerFrameTick(
      system,
      (ctx) => callbackRef.current(ctx),
      { priority, label, enabled: enabledRef.current, phase, critical },
    );
    tickIdRef.current = id;
    return () => {
      unregisterFrameTick(id);
      tickIdRef.current = null;
    };
  }, [system, priority, label, phase, critical]);

  useEffect(() => {
    if (tickIdRef.current != null) {
      setFrameTickEnabled(tickIdRef.current, enabled);
    }
  }, [enabled]);
}

/** Shorthand for post-render frame ticks (profiler, canvas guards). */
export function usePostFrameTick(
  system: FrameSystemId,
  callback: FrameTickCallback,
  options: Omit<FrameTickOptions, 'phase'> = {},
): void {
  useFrameTick(system, callback, { ...options, phase: 'post' });
}
