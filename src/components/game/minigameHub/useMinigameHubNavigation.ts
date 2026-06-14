import { useCallback, useEffect, useRef, useState } from 'react';
import { consumeButtonPress, GAMEPAD, pollGamepad } from '@/engine/input/gamepad';
import { MINIGAME_HUB_GAMES } from '@/engine/minigame/hub/minigameHubConstants';
import {
  getMinigameHubColumns,
  keyToHubGridDirection,
  moveHubGridFocus,
  safePlayHubSfx,
  type HubGridDirection,
} from '@/engine/minigame/hub/minigameHubPresentation';
import { audioEngine } from '@/engine/AudioEngine';
import type { MinigameHubGameType } from '@/engine/minigame/hub/minigameHubConstants';

const SELECT_KEYS = new Set(['Enter', 'NumpadEnter', ' ']);
const STICK_THRESHOLD = 0.55;
const DPAD_REPEAT_MS = 180;

type UseMinigameHubNavigationArgs = {
  enabled: boolean;
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
  onLaunch: (gameType: MinigameHubGameType) => void;
};

export function useMinigameHubNavigation({
  enabled,
  selectedIndex,
  setSelectedIndex,
  onLaunch,
}: UseMinigameHubNavigationArgs): void {
  const [columns, setColumns] = useState(() =>
    typeof window !== 'undefined' ? getMinigameHubColumns(window.innerWidth) : 3,
  );

  const selectedIndexRef = useRef(selectedIndex);
  const setSelectedIndexRef = useRef(setSelectedIndex);
  const onLaunchRef = useRef(onLaunch);
  const columnsRef = useRef(columns);
  const lastDpadNavRef = useRef(0);

  selectedIndexRef.current = selectedIndex;
  setSelectedIndexRef.current = setSelectedIndex;
  onLaunchRef.current = onLaunch;
  columnsRef.current = columns;

  useEffect(() => {
    if (!enabled) return;

    const updateColumns = () => {
      setColumns(getMinigameHubColumns(window.innerWidth));
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, [enabled]);

  const moveSelection = useCallback((direction: HubGridDirection) => {
    const next = moveHubGridFocus(
      selectedIndexRef.current,
      direction,
      MINIGAME_HUB_GAMES.length,
      columnsRef.current,
    );
    if (next !== selectedIndexRef.current) {
      setSelectedIndexRef.current(next);
      safePlayHubSfx(audioEngine.playSfx.bind(audioEngine), 'click');
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      const direction = keyToHubGridDirection(event.key);
      if (direction) {
        event.preventDefault();
        moveSelection(direction);
        return;
      }

      if (SELECT_KEYS.has(event.key)) {
        event.preventDefault();
        const game = MINIGAME_HUB_GAMES[selectedIndexRef.current];
        if (game) onLaunchRef.current(game.gameType);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [enabled, moveSelection]);

  const previousButtonsRef = useRef<Map<number, boolean[]>>(new Map());
  const previousStickRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!enabled) return;

    let rafId = 0;

    const tick = () => {
      const frame = pollGamepad();
      if (frame.connected) {
        const padIdx = frame.index;
        const now = performance.now();

        const aPressed = frame.buttons[GAMEPAD.A] ?? false;
        if (consumeButtonPress(padIdx, GAMEPAD.A, aPressed, previousButtonsRef)) {
          const game = MINIGAME_HUB_GAMES[selectedIndexRef.current];
          if (game) onLaunchRef.current(game.gameType);
        }

        const { x, y } = frame.leftStick;
        const prev = previousStickRef.current;

        if (y <= -STICK_THRESHOLD && prev.y > -STICK_THRESHOLD) {
          moveSelection('up');
        } else if (y >= STICK_THRESHOLD && prev.y < STICK_THRESHOLD) {
          moveSelection('down');
        } else if (x <= -STICK_THRESHOLD && prev.x > -STICK_THRESHOLD) {
          moveSelection('left');
        } else if (x >= STICK_THRESHOLD && prev.x < STICK_THRESHOLD) {
          moveSelection('right');
        }

        const dpadUp = frame.buttons[12];
        const dpadDown = frame.buttons[13];
        const dpadLeft = frame.buttons[14];
        const dpadRight = frame.buttons[15];

        if ((dpadUp || dpadDown || dpadLeft || dpadRight) && now - lastDpadNavRef.current > DPAD_REPEAT_MS) {
          if (dpadUp) moveSelection('up');
          else if (dpadDown) moveSelection('down');
          else if (dpadLeft) moveSelection('left');
          else if (dpadRight) moveSelection('right');
          lastDpadNavRef.current = now;
        }

        previousStickRef.current = { x, y };
      } else {
        previousButtonsRef.current.clear();
        previousStickRef.current = { x: 0, y: 0 };
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [enabled, moveSelection]);
}
