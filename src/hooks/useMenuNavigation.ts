import { useEffect, useRef, useCallback } from 'react';
import { pollGamepad, consumeButtonPress, GAMEPAD } from '@/engine/input/gamepad';
import { audioEngine } from '@/engine/AudioEngine';

export interface MenuNavigationItem {
  id: string;
  disabled?: boolean;
}

export interface UseMenuNavigationOptions {
  items: MenuNavigationItem[];
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
  onSelect: (id: string) => void;
  /** When false, keyboard/gamepad handlers are inactive. */
  enabled: boolean;
}

const STICK_DEADZONE = 0.45;
const REPEAT_MS = 180;

/**
 * Unified keyboard + gamepad navigation for menu lists.
 * Arrow keys / WASD + D-pad / left stick; Enter / A to confirm.
 */
export function useMenuNavigation({
  items,
  selectedIndex,
  setSelectedIndex,
  onSelect,
  enabled,
}: UseMenuNavigationOptions): void {
  const enabledIndices = items.map((item, i) => (!item.disabled ? i : -1)).filter((i) => i >= 0);

  const moveSelection = useCallback(
    (direction: 1 | -1) => {
      if (enabledIndices.length === 0) return;
      const currentIdx = enabledIndices.indexOf(selectedIndex);
      const base = currentIdx >= 0 ? currentIdx : 0;
      const next =
        direction === 1
          ? base < enabledIndices.length - 1
            ? base + 1
            : 0
          : base > 0
            ? base - 1
            : enabledIndices.length - 1;
      setSelectedIndex(enabledIndices[next]!);
      audioEngine.playSfx('click');
    },
    [enabledIndices, selectedIndex, setSelectedIndex],
  );

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      switch (e.code) {
        case 'ArrowUp':
        case 'KeyW':
          e.preventDefault();
          moveSelection(-1);
          break;
        case 'ArrowDown':
        case 'KeyS':
          e.preventDefault();
          moveSelection(1);
          break;
        case 'Enter':
        case 'NumpadEnter':
        case 'Space': {
          e.preventDefault();
          const item = items[selectedIndex];
          if (item && !item.disabled) onSelect(item.id);
          break;
        }
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, items, selectedIndex, moveSelection, onSelect]);

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

        const stickUp = frame.leftStick.y < -STICK_DEADZONE;
        const stickDown = frame.leftStick.y > STICK_DEADZONE;
        const dpadUp = frame.buttons[12];
        const dpadDown = frame.buttons[13];

        if ((stickUp || dpadUp || stickDown || dpadDown) && now - lastStickNavRef.current > REPEAT_MS) {
          if (stickUp || dpadUp) moveSelection(-1);
          else moveSelection(1);
          lastStickNavRef.current = now;
        }

        if (consumeButtonPress(padIdx, GAMEPAD.A, frame.buttons[GAMEPAD.A] ?? false, previousButtonsRef)) {
          const item = items[selectedIndex];
          if (item && !item.disabled) onSelect(item.id);
        }
      } else {
        previousButtonsRef.current.clear();
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [enabled, items, selectedIndex, moveSelection, onSelect]);
}
