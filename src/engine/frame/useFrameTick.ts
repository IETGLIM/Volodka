import { useLayoutEffect, useRef } from 'react';
import type * as THREE from 'three';
import {
  registerFrameTick,
  setFrameTickEnabled,
  unregisterFrameTick,
} from './FrameBudgetRegistry';
import { isFrameSimulationActive } from './frameVisibility';
import { normalizeFrameTickPhase, type FrameSystemId, type FrameTickCallback, type FrameTickOptions } from './types';

function isObject3DVisibleInScene(object: THREE.Object3D): boolean {
  let node: THREE.Object3D | null = object;
  while (node) {
    if (!node.visible) return false;
    node = node.parent;
  }
  return true;
}

function wrapFrameTickGuards(
  callback: FrameTickCallback,
  visibilityRef?: FrameTickOptions['visibilityRef'],
): FrameTickCallback {
  return (ctx) => {
    if (!isFrameSimulationActive()) return;
    if (visibilityRef?.current && !isObject3DVisibleInScene(visibilityRef.current)) return;
    callback(ctx);
  };
}

/** Register a per-frame callback in the central budget runner. */
export function useFrameTick(
  system: FrameSystemId,
  callback: FrameTickCallback,
  options: FrameTickOptions = {},
): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const { priority = 0, label, enabled = true, phase = 'pre_render', visibilityRef, critical } = options;
  const tickIdRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    const id = registerFrameTick(
      system,
      wrapFrameTickGuards((ctx) => callbackRef.current(ctx), visibilityRef),
      { priority, label, enabled, phase: normalizeFrameTickPhase(phase), critical },
    );
    tickIdRef.current = id;
    return () => {
      unregisterFrameTick(id);
      tickIdRef.current = null;
    };
  }, [system, priority, label, phase, enabled, visibilityRef, critical]);

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
