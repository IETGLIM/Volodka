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
 * Clear path: `clearSharedVirtualControls()` on overlay lock / scene handoff.
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

/** Zero touch / gamepad locomotion input (overlay lock, scene transitions). */
export function clearSharedVirtualControls(): void {
  const vc = sharedVirtualControlsRef.current;
  vc.forward = 0;
  vc.backward = 0;
  vc.left = 0;
  vc.right = 0;
  vc.run = 0;
  vc.jump = 0;
  vc.moveMagnitude = 0;
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
