import { useLayoutEffect, useRef } from 'react';
import {
  registerFrameTick,
  setFrameTickEnabled,
  unregisterFrameTick,
} from './FrameBudgetRegistry';
import { normalizeFrameTickPhase, type FrameSystemId, type FrameTickCallback, type FrameTickOptions } from './types';

/** Register a per-frame callback in the central budget runner. */
export function useFrameTick(
  system: FrameSystemId,
  callback: FrameTickCallback,
  options: FrameTickOptions = {},
): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const { priority = 0, label, enabled = true, phase = 'pre_render' } = options;
  const tickIdRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    const id = registerFrameTick(
      system,
      (ctx) => callbackRef.current(ctx),
      { priority, label, enabled, phase: normalizeFrameTickPhase(phase) },
    );
    tickIdRef.current = id;
    return () => {
      unregisterFrameTick(id);
      tickIdRef.current = null;
    };
  }, [system, priority, label, phase, enabled]);

  useLayoutEffect(() => {
    if (tickIdRef.current != null) {
      setFrameTickEnabled(tickIdRef.current, enabled);
    }
  }, [enabled]);
}

/** Shorthand for post_render frame ticks (profiler, canvas guards). */
export function usePostFrameTick(
  system: FrameSystemId,
  callback: FrameTickCallback,
  options: Omit<FrameTickOptions, 'phase'> = {},
): void {
  useFrameTick(system, callback, { ...options, phase: 'post_render' });
}
