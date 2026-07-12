import { useCallback, useEffect, useRef, type RefObject } from 'react';
import { consumeButtonPress, GAMEPAD, pollGamepad } from '@/engine/input/gamepad';
import { audioEngine } from '@/engine/AudioEngine';

const STICK_DEADZONE = 0.45;
const REPEAT_MS = 180;

export interface UseJournalListNavigationOptions {
  enabled: boolean;
  itemCount: number;
  focusedIndex: number;
  setFocusedIndex: (index: number) => void;
  onSelectIndex: (index: number) => void;
  listRef: RefObject<HTMLElement | null>;
}

export function useJournalListNavigation({
  enabled,
  itemCount,
  focusedIndex,
  setFocusedIndex,
  onSelectIndex,
  listRef,
}: UseJournalListNavigationOptions): void {
  const moveSelection = useCallback(
    (direction: 1 | -1) => {
      if (itemCount === 0) return;
      const next = direction === 1
        ? focusedIndex < itemCount - 1
          ? focusedIndex + 1
          : 0
        : focusedIndex > 0
          ? focusedIndex - 1
          : itemCount - 1;
      setFocusedIndex(next);
      onSelectIndex(next);
      audioEngine.playSfx('click');
      listRef.current?.focus();
    },
    [itemCount, focusedIndex, setFocusedIndex, onSelectIndex, listRef],
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
        case 'Space':
          e.preventDefault();
          onSelectIndex(focusedIndex);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, moveSelection, onSelectIndex, focusedIndex]);

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
          onSelectIndex(focusedIndex);
        }
      } else {
        previousButtonsRef.current.clear();
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [enabled, moveSelection, onSelectIndex, focusedIndex]);
}

export function formatJournalNoteTime(timestamp: number): string {
  if (timestamp > 1_000_000_000_000) {
    return new Date(timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  }
  return `#${timestamp + 1}`;
}
