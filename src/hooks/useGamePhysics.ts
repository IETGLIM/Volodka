
/* ─── Volodka RPG – player controls hook ─── */

import { useEffect, useRef, useCallback, type MutableRefObject } from 'react';
import { bindKeyboardInput, sampleKeyboardMovement } from '@/engine/keyboardInputState';

export interface VirtualControls {
  forward: number;
  backward: number;
  left: number;
  right: number;
  run: number;
  jump: number;
  /** Analog stick magnitude 0–1 (gamepad); 1 for keyboard/touch axis peaks. */
  moveMagnitude: number;
}

export interface PlayerControls {
  virtualControlsRef: React.MutableRefObject<VirtualControls>;
  onInteractPress: (() => void) | null;
  /** Get current key states — call from useFrame, not render */
  getKeys: () => {
    forward: boolean;
    backward: boolean;
    left: boolean;
    right: boolean;
    run: boolean;
    jump: boolean;
    interact: boolean;
    hasMovement: boolean;
  };
}

/**
 * Hook that reads keyboard input for WASD + Shift + Space + E movement.
 * Keyboard state lives in a module singleton (survives PhysicsPlayer remounts).
 * Merges with virtualControlsRef for mobile / gamepad touch input.
 */
export function usePlayerControls(
  onInteractPress?: () => void,
  /** Shared ref from VirtualControlsContext — mobile HUD / gamepad write here. */
  externalVirtualControlsRef?: MutableRefObject<VirtualControls>,
): PlayerControls {
  const localVirtualControlsRef = useRef<VirtualControls>({
    forward: 0,
    backward: 0,
    left: 0,
    right: 0,
    run: 0,
    jump: 0,
    moveMagnitude: 0,
  });
  const virtualControlsRef = externalVirtualControlsRef ?? localVirtualControlsRef;

  const interactPressRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    interactPressRef.current = onInteractPress ?? null;
  }, [onInteractPress]);

  useEffect(() => {
    return bindKeyboardInput(() => {
      interactPressRef.current?.();
    });
  }, []);

  const getKeys = useCallback(() => {
    const kb = sampleKeyboardMovement();
    return {
      forward: kb.forward,
      backward: kb.backward,
      left: kb.left,
      right: kb.right,
      run: kb.run,
      jump: kb.jump,
      interact: kb.interact,
      hasMovement: kb.hasMovement,
    };
  }, []);

  useEffect(() => {
    // WoW-style: both mouse buttons held → walk forward (desktop only).
    let mouseOwnsForward = false;
    const updateMouseMove = (buttons: number) => {
      const bothHeld = (buttons & 1) !== 0 && (buttons & 2) !== 0;
      if (bothHeld) {
        virtualControlsRef.current.forward = 1;
        virtualControlsRef.current.moveMagnitude = 1;
        mouseOwnsForward = true;
      } else if (mouseOwnsForward) {
        virtualControlsRef.current.forward = 0;
        virtualControlsRef.current.moveMagnitude = 0;
        mouseOwnsForward = false;
      }
    };
    const onMouseDown = (e: MouseEvent) => updateMouseMove(e.buttons);
    const onMouseUp = (e: MouseEvent) => updateMouseMove(e.buttons);
    const onMouseMove = (e: MouseEvent) => updateMouseMove(e.buttons);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
    return () => {
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      if (mouseOwnsForward) {
        // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional stable deps
        virtualControlsRef.current.forward = 0;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional stable deps
  }, []);

  return {
    virtualControlsRef,
    onInteractPress: onInteractPress ?? null,
    getKeys,
  };
}
