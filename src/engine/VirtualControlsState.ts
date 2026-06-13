/* ─── Volodka RPG – Shared virtual controls via React Context ─── */

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
 * Both RPGGameCanvas and GameOrchestrator/ExplorationMobileHud
 * read/write the SAME object through this ref.
 *
 * P0-2.7 FIX: Now also available via React Context for explicit dependency
 * injection. The module-level ref remains for backward compatibility and
 * for useFrame access inside R3F (which can't use hooks synchronously).
 */
export const sharedVirtualControlsRef: MutableRefObject<VirtualControls> = {
  current: defaultControls,
};

/**
 * React Context for virtual controls ref.
 * Provides the shared ref through React's dependency injection system,
 * making the relationship between writer (ExplorationMobileHud) and
 * reader (RPGGameCanvas/PhysicsPlayer) explicit.
 *
 * Provider: GameOrchestrator (renders above both Canvas and DOM layers)
 * Consumers: RPGGameCanvas, ExplorationMobileHud
 */
export const VirtualControlsContext = createContext<MutableRefObject<VirtualControls>>(
  sharedVirtualControlsRef,
);

/** Hook to access virtual controls ref via Context */
export function useVirtualControlsRef(): MutableRefObject<VirtualControls> {
  return useContext(VirtualControlsContext);
}
