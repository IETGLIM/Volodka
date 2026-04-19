import type { PlayerPosition } from '@/data/rpgTypes';

/**
 * Мост между физикой обхода и остальным приложением без записи в Zustand на каждом кадре.
 * `RPGGameCanvas` обновляет снимок из `onPositionChange`; `saveGame` подмешивает его в стор перед сериализацией;
 * `MiniMap` может читать снимок по таймеру.
 */
let live: PlayerPosition | null = null;

export function updateExplorationLivePlayerPosition(pos: PlayerPosition): void {
  live = { ...pos };
}

export function getExplorationLivePlayerPositionOrNull(): PlayerPosition | null {
  return live;
}

export function clearExplorationLivePlayerPosition(): void {
  live = null;
}
