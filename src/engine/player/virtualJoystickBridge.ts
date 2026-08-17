/* ─── Volodka RPG – Virtual Joystick → Player Movement Bridge ───
 *
 * Subscribes to joystickStore and writes to sharedVirtualControlsRef
 * (the same write path used by ExplorationMobileHud D-pad and gamepad).
 *
 * Mapping:
 *   joystick Y > 0 (screen-up / finger drag up) → forward
 *   joystick Y < 0 (screen-down / finger drag down) → backward
 *   joystick X > 0 (screen-right) → right
 *   joystick X < 0 (screen-left) → left
 *   magnitude → moveMagnitude (analog speed scale)
 *
 * The engine's resolveMovementIntent() then merges this with keyboard
 * input (keyboard wins when both are active), and applies the analog
 * speed scale for gradual movement from partial deflection.
 */

import { joystickStore } from '@/hooks/useVirtualJoystick';
import type { JoystickState } from '@/hooks/useVirtualJoystick';
import {
  sharedVirtualControlsRef,
  areSharedVirtualControlsWritable,
} from '@/engine/VirtualControlsState';
import type { VirtualControls } from '@/hooks/useGamePhysics';

/** Subscription cleanup handle */
let unsubscribe: (() => void) | null = null;

/**
 * Write joystick state to the shared virtual controls ref.
 * Called on every joystick state change (store subscriber).
 *
 * The mapping converts analog X/Y into the discrete forward/back/left/right
 * axes that the existing movement system expects. When both positive and
 * negative axes on the same dimension are non-zero (shouldn't happen with
 * a joystick, but defensive), the dominant one wins.
 */
function applyJoystickToVirtualControls(state: JoystickState): void {
  // Respect the write gate (overlay lock, scene transition, etc.)
  if (!areSharedVirtualControlsWritable()) return;

  const vc = sharedVirtualControlsRef.current;

  if (!state.active || state.magnitude < 0.01) {
    // Joystick at rest — zero all movement axes
    vc.forward = 0;
    vc.backward = 0;
    vc.left = 0;
    vc.right = 0;
    vc.moveMagnitude = 0;
    return;
  }

  // Map joystick axes to virtual control axes
  // Y > 0 = forward (screen-up), Y < 0 = backward (screen-down)
  // X > 0 = right, X < 0 = left
  vc.forward = state.y > 0 ? Math.min(1, state.y) : 0;
  vc.backward = state.y < 0 ? Math.min(1, -state.y) : 0;
  vc.right = state.x > 0 ? Math.min(1, state.x) : 0;
  vc.left = state.x < 0 ? Math.min(1, -state.x) : 0;
  vc.moveMagnitude = state.magnitude;

  // Run and jump are NOT set by the joystick — those remain on
  // the existing D-pad buttons (run toggle + jump button).
  // The joystick only controls directional movement.
}

/**
 * Start the joystick bridge.
 * Subscribes to joystickStore changes and writes to sharedVirtualControlsRef.
 * Safe to call multiple times — idempotent.
 */
export function startVirtualJoystickBridge(): void {
  if (unsubscribe) return; // already running

  // Initial sync
  applyJoystickToVirtualControls(joystickStore.getState());

  // Subscribe to future changes
  unsubscribe = joystickStore.subscribe(() => {
    applyJoystickToVirtualControls(joystickStore.getState());
  });
}

/**
 * Stop the joystick bridge and zero virtual controls.
 * Call on unmount / scene transition.
 */
export function stopVirtualJoystickBridge(): void {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
  // Zero out any residual joystick input
  const vc = sharedVirtualControlsRef.current;
  // Only zero if the current values look like joystick output
  // (don't clobber gamepad or D-pad values)
  // We zero all axes since the joystick was the last writer
  vc.forward = 0;
  vc.backward = 0;
  vc.left = 0;
  vc.right = 0;
  vc.moveMagnitude = 0;
}

/**
 * Utility: snapshot current joystick-derived virtual controls.
 * For testing / debugging.
 */
export function getJoystickVirtualControls(): VirtualControls {
  const vc = sharedVirtualControlsRef.current;
  return {
    forward: vc.forward,
    backward: vc.backward,
    left: vc.left,
    right: vc.right,
    run: vc.run,
    jump: vc.jump,
    moveMagnitude: vc.moveMagnitude,
  };
}
