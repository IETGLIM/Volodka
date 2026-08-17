/* ─── Volodka RPG – Virtual Joystick State ───
 *
 * Exposes reactive joystick X/Y values and a container ref.
 * Uses a module-level store so the engine can read values
 * without React re-renders (same pattern as sharedVirtualControlsRef).
 *
 * The visual component writes here; the bridge reads from here.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTouchDevice } from './useTouchDevice';

/** Normalized joystick axes: -1 (left/back) → 0 (center) → 1 (right/forward) */
export interface JoystickState {
  /** Horizontal axis: -1 (left) → 1 (right) */
  x: number;
  /** Vertical axis: -1 (backward/down) → 1 (forward/up) */
  y: number;
  /** Euclidean magnitude 0–1 (0 = idle, 1 = fully deflected) */
  magnitude: number;
  /** Whether a finger is actively dragging the joystick */
  active: boolean;
}

const INITIAL_STATE: JoystickState = {
  x: 0,
  y: 0,
  magnitude: 0,
  active: false,
};

/**
 * Module-level reactive store — avoids re-renders in the engine read path.
 * The bridge subscribes directly to this object (no React overhead).
 */
const joystickStore = {
  state: { ...INITIAL_STATE },
  listeners: new Set<() => void>(),

  set(x: number, y: number, active: boolean): void {
    const magnitude = Math.min(1, Math.hypot(x, y));
    this.state.x = x;
    this.state.y = y;
    this.state.magnitude = magnitude;
    this.state.active = active;
    this.listeners.forEach((fn) => fn());
  },

  reset(): void {
    this.state.x = 0;
    this.state.y = 0;
    this.state.magnitude = 0;
    this.state.active = false;
    this.listeners.forEach((fn) => fn());
  },

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => { this.listeners.delete(fn); };
  },

  /** Snapshot without subscribing — use in useFrame / engine ticks */
  getState(): JoystickState {
    return this.state;
  },
};

export { joystickStore };

/**
 * Hook: reactive joystick state for UI components.
 * Returns a snapshot that updates on every joystick change.
 *
 * For engine integration, import `joystickStore` directly and call
 * `getState()` inside useFrame — zero re-render overhead.
 */
export function useVirtualJoystick() {
  const isTouch = useTouchDevice();
  const [state, setState] = useState<JoystickState>(INITIAL_STATE);

  useEffect(() => {
    if (!isTouch) return;
    return joystickStore.subscribe(() => {
      setState(joystickStore.getState());
    });
  }, [isTouch]);

  const containerRef = useRef<HTMLDivElement>(null);

  const update = useCallback((x: number, y: number, active: boolean) => {
    joystickStore.set(x, y, active);
  }, []);

  const reset = useCallback(() => {
    joystickStore.reset();
  }, []);

  return {
    x: state.x,
    y: state.y,
    magnitude: state.magnitude,
    active: state.active,
    isTouchDevice: isTouch,
    containerRef,
    update,
    reset,
  };
}
