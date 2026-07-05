import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { consumeButtonPress, GAMEPAD, pollGamepad } from '@/engine/input/gamepad';
import { audioEngine } from '@/engine/AudioEngine';

const STICK_DEADZONE = 0.45;
const REPEAT_MS = 180;

export function useInventoryGridColumns(containerRef: RefObject<HTMLElement | null>) {
  const [columns, setColumns] = useState(4);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const update = () => {
      const width = node.clientWidth;
      if (width < 640) setColumns(2);
      else if (width < 1024) setColumns(3);
      else setColumns(4);
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, [containerRef]);

  return columns;
}

export interface UseInventoryGridNavigationOptions {
  enabled: boolean;
  itemCount: number;
  columnCount: number;
  focusedIndex: number;
  setFocusedIndex: (index: number) => void;
  selectedItemId: string | null;
  onSelectIndex: (index: number) => void;
  onConfirm: () => void;
  onCloseDetail: () => void;
  gridContainerRef: RefObject<HTMLElement | null>;
}

export function useInventoryGridNavigation({
  enabled,
  itemCount,
  columnCount,
  focusedIndex,
  setFocusedIndex,
  selectedItemId,
  onSelectIndex,
  onConfirm,
  onCloseDetail,
  gridContainerRef,
}: UseInventoryGridNavigationOptions): void {
  const clampIndex = useCallback(
    (index: number) => Math.max(0, Math.min(itemCount - 1, index)),
    [itemCount],
  );

  const moveFocus = useCallback(
    (deltaRow: number, deltaCol: number) => {
      if (itemCount === 0) return;
      const row = Math.floor(focusedIndex / columnCount);
      const col = focusedIndex % columnCount;
      const nextRow = row + deltaRow;
      const nextCol = col + deltaCol;
      if (nextCol < 0 || nextCol >= columnCount) return;
      const nextIndex = nextRow * columnCount + nextCol;
      if (nextIndex >= itemCount) return;
      setFocusedIndex(clampIndex(nextIndex));
      onSelectIndex(clampIndex(nextIndex));
      audioEngine.playSfx('click');
    },
    [itemCount, columnCount, focusedIndex, setFocusedIndex, clampIndex, onSelectIndex],
  );

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if (e.key === 'Escape') {
        if (selectedItemId) {
          e.preventDefault();
          e.stopPropagation();
          onCloseDetail();
          gridContainerRef.current?.focus();
        }
        return;
      }

      switch (e.code) {
        case 'ArrowUp':
        case 'KeyW':
          e.preventDefault();
          moveFocus(-1, 0);
          break;
        case 'ArrowDown':
        case 'KeyS':
          e.preventDefault();
          moveFocus(1, 0);
          break;
        case 'ArrowLeft':
        case 'KeyA':
          e.preventDefault();
          moveFocus(0, -1);
          break;
        case 'ArrowRight':
        case 'KeyD':
          e.preventDefault();
          moveFocus(0, 1);
          break;
        case 'Enter':
        case 'NumpadEnter':
        case 'Space':
          e.preventDefault();
          onConfirm();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [
    enabled,
    selectedItemId,
    moveFocus,
    onConfirm,
    onCloseDetail,
    gridContainerRef,
  ]);

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
        const stickLeft = frame.leftStick.x < -STICK_DEADZONE;
        const stickRight = frame.leftStick.x > STICK_DEADZONE;
        const dpadUp = frame.buttons[12];
        const dpadDown = frame.buttons[13];
        const dpadLeft = frame.buttons[14];
        const dpadRight = frame.buttons[15];

        if (
          (stickUp || dpadUp || stickDown || dpadDown || stickLeft || dpadLeft || stickRight || dpadRight)
          && now - lastStickNavRef.current > REPEAT_MS
        ) {
          if (stickUp || dpadUp) moveFocus(-1, 0);
          else if (stickDown || dpadDown) moveFocus(1, 0);
          else if (stickLeft || dpadLeft) moveFocus(0, -1);
          else if (stickRight || dpadRight) moveFocus(0, 1);
          lastStickNavRef.current = now;
        }

        if (consumeButtonPress(padIdx, GAMEPAD.A, frame.buttons[GAMEPAD.A] ?? false, previousButtonsRef)) {
          onConfirm();
        }

        if (consumeButtonPress(padIdx, GAMEPAD.B, frame.buttons[GAMEPAD.B] ?? false, previousButtonsRef)) {
          if (selectedItemId) {
            onCloseDetail();
            gridContainerRef.current?.focus();
          }
        }
      } else {
        previousButtonsRef.current.clear();
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [
    enabled,
    moveFocus,
    onConfirm,
    selectedItemId,
    onCloseDetail,
    gridContainerRef,
  ]);
}
