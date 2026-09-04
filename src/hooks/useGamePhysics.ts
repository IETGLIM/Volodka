
/* ─── Volodka RPG – player controls hook ─── */

import { useEffect, useRef, useCallback, type MutableRefObject } from 'react';
import { bindKeyboardInput, sampleKeyboardMovement } from '@/engine/keyboardInputState';
import { applyMouseBothButtonsForward } from '@/engine/VirtualControlsState';
import { sharedPlayerBlockRef } from '@/engine/PlayerRotationState';
import { isCanvasAreaTarget } from '@/engine/input/domUtils';

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
    crouch: boolean;
    block: boolean;
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
      crouch: kb.crouch,
      block: kb.block || sharedPlayerBlockRef.current,
      hasMovement: kb.hasMovement,
    };
  }, []);

  useEffect(() => {
    // WoW-style: both mouse buttons held → walk forward (desktop only).
    // Writes go through applyMouseBothButtonsForward so overlay lock /
    // clearSharedVirtualControls cannot fight a stuck mouse-forward assert.
    let mouseOwnsForward = false;
    const updateMouseMove = (buttons: number) => {
      mouseOwnsForward = applyMouseBothButtonsForward(buttons, mouseOwnsForward);
    };
    // Блок и «обе кнопки = вперёд» активны только для canvas-области:
    // ПКМ по DOM-панелям/меню больше не включает боевую стойку.
    const onMouseDown = (e: MouseEvent) => {
      updateMouseMove(e.buttons);
      // RMB → block state flag (только canvas-область)
      if (e.buttons & 2 && isCanvasAreaTarget(e.target)) sharedPlayerBlockRef.current = true;
    };
    const onMouseUp = (e: MouseEvent) => {
      updateMouseMove(e.buttons);
      if (!(e.buttons & 2)) sharedPlayerBlockRef.current = false;
    };
    const onMouseMove = (e: MouseEvent) => updateMouseMove(e.buttons);
    // FIX: при потере фокуса окна (alt-tab) или скрытии вкладки мышь уже не
    // «отпустит» кнопку — раньше блок залипал до следующего mouseup.
    const clearStickyMouseState = () => {
      if (mouseOwnsForward) {
        applyMouseBothButtonsForward(0, true);
        mouseOwnsForward = false;
      }
      sharedPlayerBlockRef.current = false;
    };
    const onWindowBlur = () => clearStickyMouseState();
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') clearStickyMouseState();
    };
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('blur', onWindowBlur);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('blur', onWindowBlur);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (mouseOwnsForward) {
        applyMouseBothButtonsForward(0, true);
      }
      sharedPlayerBlockRef.current = false;
    };
  }, []);

  return {
    virtualControlsRef,
    onInteractPress: onInteractPress ?? null,
    getKeys,
  };
}
