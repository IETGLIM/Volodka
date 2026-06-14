import { useEffect, useRef } from 'react';
import { consumeButtonPress, GAMEPAD, pollGamepad } from '@/engine/input/gamepad';

/** Escape + gamepad A/Start to skip intro cinematics. */
export function useIntroSkipInput(enabled: boolean, onSkip: () => void): void {
  const previousButtonsRef = useRef<Map<number, boolean[]>>(new Map());

  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      onSkip();
    };

    window.addEventListener('keydown', onKeyDown);

    let rafId = 0;
    const tick = () => {
      const frame = pollGamepad();
      if (frame.connected) {
        const padIdx = frame.index;
        const aPressed = frame.buttons[GAMEPAD.A] ?? false;
        const startPressed = frame.buttons[GAMEPAD.START] ?? false;
        if (
          consumeButtonPress(padIdx, GAMEPAD.A, aPressed, previousButtonsRef)
          || consumeButtonPress(padIdx, GAMEPAD.START, startPressed, previousButtonsRef)
        ) {
          onSkip();
        }
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      cancelAnimationFrame(rafId);
    };
  }, [enabled, onSkip]);
}
