import { useCallback, useEffect, useRef } from 'react';
import { consumeButtonPress, GAMEPAD, pollGamepad } from '@/engine/input/gamepad';
import { audioEngine } from '@/engine/AudioEngine';
import type { KarmaPoemTab } from '@/engine/karmaPoem/karmaPoemPresentation';

const TABS: KarmaPoemTab[] = ['karma', 'poems'];
const STICK_DEADZONE = 0.45;
const REPEAT_MS = 220;

export function useKarmaPoemTabNavigation(
  enabled: boolean,
  activeTab: KarmaPoemTab,
  setActiveTab: (tab: KarmaPoemTab) => void,
): void {
  const moveTab = useCallback(
    (direction: 1 | -1) => {
      const index = TABS.indexOf(activeTab);
      const next = TABS[(index + direction + TABS.length) % TABS.length]!;
      setActiveTab(next);
      audioEngine.playSfx('click');
    },
    [activeTab, setActiveTab],
  );

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'ArrowLeft':
        case 'KeyA':
          event.preventDefault();
          moveTab(-1);
          break;
        case 'ArrowRight':
        case 'KeyD':
          event.preventDefault();
          moveTab(1);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, moveTab]);

  const previousButtonsRef = useRef<Map<number, boolean[]>>(new Map());
  const lastStickNavRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    let rafId = 0;

    const tick = () => {
      const frame = pollGamepad();
      if (frame.connected) {
        const padIdx = frame.index;
        const now = performance.now();
        const stickLeft = frame.leftStick.x < -STICK_DEADZONE;
        const stickRight = frame.leftStick.x > STICK_DEADZONE;
        const dpadLeft = frame.buttons[14];
        const dpadRight = frame.buttons[15];

        if ((stickLeft || dpadLeft || stickRight || dpadRight) && now - lastStickNavRef.current > REPEAT_MS) {
          if (stickLeft || dpadLeft) moveTab(-1);
          else moveTab(1);
          lastStickNavRef.current = now;
        }

        if (consumeButtonPress(padIdx, GAMEPAD.LB, frame.buttons[GAMEPAD.LB] ?? false, previousButtonsRef)) {
          moveTab(-1);
        }
        if (consumeButtonPress(padIdx, GAMEPAD.RB, frame.buttons[GAMEPAD.RB] ?? false, previousButtonsRef)) {
          moveTab(1);
        }
      } else {
        previousButtonsRef.current.clear();
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [enabled, moveTab]);
}
