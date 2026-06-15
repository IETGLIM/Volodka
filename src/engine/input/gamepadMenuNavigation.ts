/** Gamepad-driven focus navigation for menu surfaces (pause, settings). */

import { GAMEPAD } from '@/engine/input/gamepad';

export type GamepadMenuAction = 'next' | 'prev' | 'activate' | 'back';

export function resolveGamepadMenuAction(
  buttons: readonly boolean[],
  previousButtons: readonly boolean[],
): GamepadMenuAction | null {
  const pressed = (index: number) => Boolean(buttons[index]) && !previousButtons[index];

  if (pressed(GAMEPAD.B) || pressed(GAMEPAD.SELECT)) return 'back';
  if (pressed(GAMEPAD.A) || pressed(GAMEPAD.START)) return 'activate';

  const dpadUp = pressed(12);
  const dpadDown = pressed(13);
  if (dpadDown) return 'next';
  if (dpadUp) return 'prev';

  return null;
}

export function moveMenuFocusIndex(
  currentIndex: number,
  itemCount: number,
  action: GamepadMenuAction,
): number {
  if (itemCount <= 0) return 0;
  if (action === 'next') return (currentIndex + 1) % itemCount;
  if (action === 'prev') return (currentIndex - 1 + itemCount) % itemCount;
  return currentIndex;
}
