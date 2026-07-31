/* ─── Volodka RPG – Shared virtual controls via React Context ─── */

/**
 * ONE WRITE PATH for locomotion axes (touch / gamepad / mouse-both-buttons):
 *
 *   ExplorationMobileHud / useGamepadInput / usePlayerControls(mouse)
 *        → sharedVirtualControlsRef.current  (VirtualControls)
 *        → PhysicsPlayer / SimplePlayer merge with keyboardInputState
 *
 * Keyboard WASD lives in `keyboardInputState` (module singleton) — not this ref.
 * Orchestrator shortcuts use `useKeyboardShortcutManager` (panels / Escape) —
 * never write locomotion axes there.
 *
 * Clear / gate path:
 *   `clearSharedVirtualControls()` zeros axes (overlay lock, gamepad block, HUD reset).
 *   `setSharedVirtualControlsWritable(false)` zeros + closes the write gate for the
 *   whole locomotion lock so mouse-both-buttons cannot re-assert over gamepad clear.
 *   Unlock → `setSharedVirtualControlsWritable(true)`.
 */

import { createContext, useContext } from 'react';
import type { MutableRefObject } from 'react';
import type { VirtualControls } from '@/hooks/useGamePhysics';

/**
 * Default controls — all zeros (no input).
 * This object is the initial .current of the shared ref.
 */
const defaultControls: VirtualControls = {
  forward: 0,
  backward: 0,
  left: 0,
  right: 0,
  run: 0,
  jump: 0,
  moveMagnitude: 0,
};

/**
 * Module-level shared ref for virtual controls.
 * Writers: ExplorationMobileHud (touch), useGamepadInput, mouse-both-buttons.
 * Readers: PhysicsPlayer / SimplePlayer via usePlayerControls + useFrame.
 *
 * Also available via React Context for explicit DI; module ref remains for
 * useFrame (cannot use hooks synchronously inside R3F frame callbacks).
 */
export const sharedVirtualControlsRef: MutableRefObject<VirtualControls> = {
  current: defaultControls,
};

/** Closed while locomotion locked — blocks touch / gamepad / mouse writers. */
let writable = true;

function zeroVirtualControls(vc: VirtualControls): void {
  vc.forward = 0;
  vc.backward = 0;
  vc.left = 0;
  vc.right = 0;
  vc.run = 0;
  vc.jump = 0;
  vc.moveMagnitude = 0;
}

/** Zero touch / gamepad / mouse locomotion input (overlay lock, scene transitions). */
export function clearSharedVirtualControls(): void {
  zeroVirtualControls(sharedVirtualControlsRef.current);
}

export function areSharedVirtualControlsWritable(): boolean {
  return writable;
}

/**
 * Open/close the shared virtual write gate.
 * Closing also zeros axes so mouse-both-buttons cannot fight gamepad clear mid-lock.
 */
export function setSharedVirtualControlsWritable(next: boolean): void {
  writable = next;
  if (!next) {
    zeroVirtualControls(sharedVirtualControlsRef.current);
  }
}

/**
 * WoW-style both-mouse-buttons → forward.
 * Returns updated ownership; no-ops (and clears ownership) while write gate is closed.
 */
export function applyMouseBothButtonsForward(buttons: number, ownsForward: boolean): boolean {
  const vc = sharedVirtualControlsRef.current;
  if (!writable) {
    return false;
  }

  const bothHeld = (buttons & 1) !== 0 && (buttons & 2) !== 0;
  if (bothHeld) {
    vc.forward = 1;
    vc.moveMagnitude = 1;
    return true;
  }
  if (ownsForward) {
    vc.forward = 0;
    vc.moveMagnitude = 0;
  }
  return false;
}

/** Test / engine-reset: reopen gate and zero axes. */
export function resetSharedVirtualControlsState(): void {
  writable = true;
  zeroVirtualControls(sharedVirtualControlsRef.current);
}

/**
 * React Context for virtual controls ref.
 * Provider: OrchestratorContent (above Canvas + DOM HUD)
 * Consumers: RPGGameCanvas, ExplorationMobileHud
 */
export const VirtualControlsContext = createContext<MutableRefObject<VirtualControls>>(
  sharedVirtualControlsRef,
);

/** Hook to access virtual controls ref via Context */
export function useVirtualControlsRef(): MutableRefObject<VirtualControls> {
  return useContext(VirtualControlsContext);
}
