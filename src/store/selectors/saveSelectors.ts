/* ─── Volodka RPG – Save slice selectors ─── */

import type { GameStoreState } from '../types';

/* ── Actions ── */

export const selectSaveGame = (s: GameStoreState) => s.saveGame;
export const selectLoadGame = (s: GameStoreState) => s.loadGame;
export const selectResetGame = (s: GameStoreState) => s.resetGame;
