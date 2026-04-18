/**
 * Элементы с `data-exploration-ui` — тач-HUD, миникарта, верхняя панель: клик не должен
 * запускать вращение орбитальной камеры (`FollowCamera` слушает `window` mousedown/touchstart).
 */
export const EXPLORATION_UI_ATTR = 'data-exploration-ui';

export function explorationPointerBlocksCameraOrbit(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest(`[${EXPLORATION_UI_ATTR}]`));
}
