import { useCallback, useEffect, useRef, useState } from 'react';
import { consumeButtonPress, GAMEPAD, pollGamepad } from '@/engine/input/gamepad';
import { eventBus } from '@/engine/EventBus';
import {
  LEVEL_UP_DISMISS_MS,
  LEVEL_UP_DISMISS_MS_REDUCED,
} from '@/engine/levelUp/levelUpConstants';
import type { LevelUpViewState } from '@/engine/levelUp/levelUpPresentation';
import { levelUpTelemetry } from '@/engine/levelUp/levelUpTelemetry';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';

export function useLevelUpSkipInput(enabled: boolean, onSkip: () => void): void {
  const onSkipRef = useRef(onSkip);
  onSkipRef.current = onSkip;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
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
        const buttons = [GAMEPAD.A, GAMEPAD.B, GAMEPAD.START, GAMEPAD.X, GAMEPAD.Y];
        for (const button of buttons) {
          if (consumeButtonPress(padIdx, button, frame.buttons[button] ?? false, previousButtonsRef)) {
            onSkipRef.current();
            break;
          }
        }
      } else {
        previousButtonsRef.current.clear();
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [enabled]);
}

export function useLevelUpEffect() {
  const reducedMotion = useEffectiveReducedMotion();
  const dismissMs = reducedMotion ? LEVEL_UP_DISMISS_MS_REDUCED : LEVEL_UP_DISMISS_MS;
  const [levelUp, setLevelUp] = useState<LevelUpViewState | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sequenceRef = useRef(0);

  const dismiss = useCallback((skipped = false) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setLevelUp((current) => {
      if (current) {
        levelUpTelemetry.track({
          action: 'level_up_dismissed',
          newLevel: current.newLevel,
          levelsGained: current.levelsGained,
          perkPointsGained: current.perkPointsGained,
          skipped,
          reducedMotion,
        });
      }
      return null;
    });
  }, [reducedMotion]);

  const triggerLevelUp = useCallback((
    newLevel: number,
    prevLevel: number,
    levelsGained = newLevel - prevLevel,
    perkPointsGained = 0,
  ) => {
    if (timerRef.current) clearTimeout(timerRef.current);

    sequenceRef.current += 1;
    const id = `levelup-${Date.now()}-${sequenceRef.current}-${newLevel}`;
    const next: LevelUpViewState = { newLevel, prevLevel, id, levelsGained, perkPointsGained };
    setLevelUp(next);

    levelUpTelemetry.track({
      action: 'level_up_shown',
      newLevel,
      levelsGained,
      perkPointsGained,
      reducedMotion,
    });

    timerRef.current = setTimeout(() => dismiss(false), dismissMs);
  }, [dismiss, dismissMs, reducedMotion]);

  useEffect(() => {
    const unsub = eventBus.on('player:levelup', (payload) => {
      triggerLevelUp(
        payload.newLevel,
        payload.prevLevel,
        payload.levelsGained ?? payload.newLevel - payload.prevLevel,
        payload.perkPointsGained ?? (payload.perkPointGained ? 1 : 0),
      );
    });
    return () => {
      unsub();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [triggerLevelUp]);

  useLevelUpSkipInput(!!levelUp, () => dismiss(true));

  return {
    levelUp,
    reducedMotion,
    dismiss,
  };
}
