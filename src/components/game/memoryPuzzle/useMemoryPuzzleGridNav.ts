import { useEffect, useRef } from 'react';
import { consumeButtonPress, GAMEPAD, pollGamepad } from '@/engine/input/gamepad';
import { GRID_SIZE, TOTAL_CELLS } from '@/engine/minigame/memory/memoryPuzzleConstants';
import type { MemoryGamePhase } from '@/engine/minigame/memory/memoryPuzzleConstants';

const MOVE_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);
const SELECT_KEYS = new Set(['Enter', ' ']);

function moveGridFocus(current: number, key: string): number {
  switch (key) {
    case 'ArrowUp':
      return Math.max(0, current - GRID_SIZE);
    case 'ArrowDown':
      return Math.min(TOTAL_CELLS - 1, current + GRID_SIZE);
    case 'ArrowLeft':
      return current % GRID_SIZE > 0 ? current - 1 : current;
    case 'ArrowRight':
      return current % GRID_SIZE < GRID_SIZE - 1 ? current + 1 : current;
    default:
      return current;
  }
}

type UseMemoryPuzzleGridNavArgs = {
  enabled: boolean;
  gamePhase: MemoryGamePhase;
  patternShowing: boolean;
  focusedCell: number;
  setFocusedCell: (index: number) => void;
  onSelect: (index: number) => void;
  onSkipPattern: () => void;
};

export function useMemoryPuzzleGridNav({
  enabled,
  gamePhase,
  patternShowing,
  focusedCell,
  setFocusedCell,
  onSelect,
  onSkipPattern,
}: UseMemoryPuzzleGridNavArgs): void {
  const onSelectRef = useRef(onSelect);
  const onSkipPatternRef = useRef(onSkipPattern);
  const focusedCellRef = useRef(focusedCell);
  const setFocusedCellRef = useRef(setFocusedCell);

  onSelectRef.current = onSelect;
  onSkipPatternRef.current = onSkipPattern;
  focusedCellRef.current = focusedCell;
  setFocusedCellRef.current = setFocusedCell;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (gamePhase === 'showing' && patternShowing && SELECT_KEYS.has(event.key)) {
        event.preventDefault();
        event.stopPropagation();
        onSkipPatternRef.current();
        return;
      }

      if (gamePhase !== 'input' || patternShowing) return;

      if (MOVE_KEYS.has(event.key)) {
        event.preventDefault();
        event.stopPropagation();
        setFocusedCellRef.current(moveGridFocus(focusedCellRef.current, event.key));
        return;
      }

      if (SELECT_KEYS.has(event.key)) {
        event.preventDefault();
        event.stopPropagation();
        onSelectRef.current(focusedCellRef.current);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [enabled, gamePhase, patternShowing]);

  const previousButtonsRef = useRef<Map<number, boolean[]>>(new Map());
  const previousStickRef = useRef({ x: 0, y: 0 });
  const STICK_THRESHOLD = 0.55;

  useEffect(() => {
    if (!enabled) return;

    let rafId = 0;

    const tick = () => {
      const frame = pollGamepad();
      if (frame.connected) {
        const padIdx = frame.index;

        if (gamePhase === 'showing' && patternShowing) {
          const aPressed = frame.buttons[GAMEPAD.A] ?? false;
          if (consumeButtonPress(padIdx, GAMEPAD.A, aPressed, previousButtonsRef)) {
            onSkipPatternRef.current();
          }
        } else if (gamePhase === 'input' && !patternShowing) {
          const aPressed = frame.buttons[GAMEPAD.A] ?? false;
          if (consumeButtonPress(padIdx, GAMEPAD.A, aPressed, previousButtonsRef)) {
            onSelectRef.current(focusedCellRef.current);
          }

          const { x, y } = frame.leftStick;
          const prev = previousStickRef.current;

          if (y <= -STICK_THRESHOLD && prev.y > -STICK_THRESHOLD) {
            setFocusedCellRef.current(moveGridFocus(focusedCellRef.current, 'ArrowUp'));
          } else if (y >= STICK_THRESHOLD && prev.y < STICK_THRESHOLD) {
            setFocusedCellRef.current(moveGridFocus(focusedCellRef.current, 'ArrowDown'));
          } else if (x <= -STICK_THRESHOLD && prev.x > -STICK_THRESHOLD) {
            setFocusedCellRef.current(moveGridFocus(focusedCellRef.current, 'ArrowLeft'));
          } else if (x >= STICK_THRESHOLD && prev.x < STICK_THRESHOLD) {
            setFocusedCellRef.current(moveGridFocus(focusedCellRef.current, 'ArrowRight'));
          }

          previousStickRef.current = { x, y };
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [enabled, gamePhase, patternShowing]);
}
