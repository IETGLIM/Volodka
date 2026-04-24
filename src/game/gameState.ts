import type { GameMode } from '@/data/rpgTypes';

/** Все значения `GameMode` относятся к полевому циклу 3D RPG. */
export type FieldGameState = GameMode;

export type GameState = GameMode;

export function isFieldGameState(mode: GameMode): mode is FieldGameState {
  return true;
}
