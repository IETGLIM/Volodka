/* ─── Volodka RPG – Save slice selectors ─── */

import { useGamePrimitive } from './hooks';
import type { GameStoreState } from '../types';

/* ── Actions ── */

export const selectSaveGame = (s: GameStoreState) => s.saveGame;
export const selectLoadGame = (s: GameStoreState) => s.loadGame;
export const selectResetGame = (s: GameStoreState) => s.resetGame;

export function useLastSaveTimestamp() {
  return useGamePrimitive((s) => s.lastSaveTimestamp);
}

export function useLastAutoSaveTimestamp() {
  return useGamePrimitive((s) => s.lastAutoSaveTimestamp);
}
