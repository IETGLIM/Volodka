import { useEffect, useRef } from 'react';
import { consumeButtonPress, GAMEPAD, pollGamepad } from '@/engine/input/gamepad';

const SKIP_KEYS = new Set(['Escape', 'Enter', ' ']);

/** Escape / Enter / Space + gamepad A/B/Start to skip or dismiss the quote overlay. */
export function useMatrixQuoteSkipInput(enabled: boolean, onInteract: () => void): void {
  const onInteractRef = useRef(onInteract);
  onInteractRef.current = onInteract;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!SKIP_KEYS.has(event.key)) return;
      event.preventDefault();
      event.stopPropagation();
      onInteractRef.current();
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [enabled]);

  const previousButtonsRef = useRef<Map<number, boolean[]>>(new Map());

  useEffect(() => {
    if (!enabled) return;

    let rafId = 0;

    const tick = () => {
      const frame = pollGamepad();
      if (frame.connected) {
        const padIdx = frame.index;
        const buttons = [GAMEPAD.A, GAMEPAD.B, GAMEPAD.START];
        for (const button of buttons) {
          const pressed = frame.buttons[button] ?? false;
          if (consumeButtonPress(padIdx, button, pressed, previousButtonsRef)) {
            onInteractRef.current();
            break;
          }
        }
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [enabled]);
}
