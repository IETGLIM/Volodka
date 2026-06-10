
/* ─── Volodka RPG – player controls hook ─── */

import { useEffect, useRef, useCallback } from 'react';

export interface VirtualControls {
  forward: number;
  backward: number;
  left: number;
  right: number;
  run: number;
  jump: number;
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
  };
}

/**
 * Hook that reads keyboard input for WASD + Shift + Space + E movement.
 * Ignores keydown with e.repeat for WASD.
 * Ignores if focus is in input/textarea/contentEditable.
 * Merges with virtualControlsRef for mobile touch input.
 */
export function usePlayerControls(
  onInteractPress?: () => void,
): PlayerControls {
  const keys = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    run: false,
    jump: false,
    interact: false,
  });

  const virtualControlsRef = useRef<VirtualControls>({
    forward: 0,
    backward: 0,
    left: 0,
    right: 0,
    run: 0,
    jump: 0,
  });

  const interactPressRef = useRef<(() => void) | null>(null);
  // Sync callback ref inside an effect to avoid ref write during render
  useEffect(() => {
    interactPressRef.current = onInteractPress ?? null;
  }, [onInteractPress]);

  const getKeys = useCallback(() => ({ ...keys.current }), []);

  const isEditable = useCallback((target: EventTarget | null): boolean => {
    if (!target || !(target instanceof HTMLElement)) return false;
    const tag = target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return true;
    if (target.isContentEditable) return true;
    return false;
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isEditable(e.target)) return;

      // Ignore repeats for WASD to avoid key-repeat
      if (e.repeat && e.code !== 'KeyE') {
        return;
      }

      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          keys.current.forward = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          keys.current.backward = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          keys.current.left = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          keys.current.right = true;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          keys.current.run = true;
          break;
        case 'Space':
          keys.current.jump = true;
          e.preventDefault();
          break;
        case 'KeyE':
          if (!e.repeat) {
            keys.current.interact = true;
            interactPressRef.current?.();
          }
          break;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (isEditable(e.target)) return;

      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          keys.current.forward = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          keys.current.backward = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          keys.current.left = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          keys.current.right = false;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          keys.current.run = false;
          break;
        case 'Space':
          keys.current.jump = false;
          break;
        case 'KeyE':
          keys.current.interact = false;
          break;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // ── WoW-style movement: holding BOTH mouse buttons walks forward ──
    // The camera-relative movement + right-button drag steering (handled by the
    // camera orbit input) makes the character walk wherever the camera faces.
    // `mouseOwnsForward` ensures we never clobber mobile-HUD touch input.
    let mouseOwnsForward = false;
    const updateMouseMove = (buttons: number) => {
      const bothHeld = (buttons & 1) !== 0 && (buttons & 2) !== 0;
      if (bothHeld) {
        virtualControlsRef.current.forward = 1;
        mouseOwnsForward = true;
      } else if (mouseOwnsForward) {
        virtualControlsRef.current.forward = 0;
        mouseOwnsForward = false;
      }
    };
    const onMouseDown = (e: MouseEvent) => updateMouseMove(e.buttons);
    const onMouseUp = (e: MouseEvent) => updateMouseMove(e.buttons);
    const onMouseMove = (e: MouseEvent) => updateMouseMove(e.buttons);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);

    // Reset all key states when window loses focus (Alt+Tab, notification, etc.)
    // Without this, keys remain "pressed" because keyup never fires during blur.
    const onBlur = () => {
      keys.current = { forward: false, backward: false, left: false, right: false, run: false, jump: false, interact: false };
      if (mouseOwnsForward) {
        virtualControlsRef.current.forward = 0;
        mouseOwnsForward = false;
      }
    };
    window.addEventListener('blur', onBlur);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('blur', onBlur);
    };
  }, [isEditable]);

  return {
    virtualControlsRef,
    onInteractPress: onInteractPress ?? null,
    getKeys,
  };
}
