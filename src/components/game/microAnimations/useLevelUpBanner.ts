import { useCallback, useEffect, useRef, useState } from 'react';
import { consumeButtonPress, GAMEPAD, pollGamepad } from '@/engine/input/gamepad';
import { LEVEL_UP_BANNER_DURATION_MS } from '@/engine/microAnimations/microAnimationsConstants';

const SKIP_KEYS = new Set(['Escape', 'Enter', ' ']);

export function useMicroAnimationSkipInput(enabled: boolean, onSkip: () => void): void {
  const onSkipRef = useRef(onSkip);
  onSkipRef.current = onSkip;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!SKIP_KEYS.has(event.key)) return;
      event.preventDefault();
      event.stopPropagation();
      onSkipRef.current();
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
        for (const button of [GAMEPAD.A, GAMEPAD.B, GAMEPAD.START]) {
          const pressed = frame.buttons[button] ?? false;
          if (consumeButtonPress(padIdx, button, pressed, previousButtonsRef)) {
            onSkipRef.current();
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

export function useLevelUpBannerTimer(
  visible: boolean,
  onHide: (() => void) | undefined,
  reducedMotion: boolean,
): { internalVisible: boolean; dismiss: () => void } {
  const [internalVisible, setInternalVisible] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onHideRef = useRef(onHide);
  onHideRef.current = onHide;

  const dismiss = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    setInternalVisible(false);
    onHideRef.current?.();
  }, []);

  useEffect(() => {
    if (!visible) {
      setInternalVisible(false);
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
      return;
    }

    setInternalVisible(true);
    const duration = reducedMotion ? 1000 : LEVEL_UP_BANNER_DURATION_MS;
    hideTimerRef.current = setTimeout(dismiss, duration);

    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    };
  }, [visible, reducedMotion, dismiss]);

  useMicroAnimationSkipInput(internalVisible, dismiss);

  return { internalVisible, dismiss };
}
