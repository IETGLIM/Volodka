import type { GameMode } from '@/data/rpgTypes';

/**
 * High-level loop for 3D RPG systems (`exploration` … `cutscene`).
 * `visual-novel` is the narrative hub mode and stays on `GameMode`; map it where 3D state does not apply.
 */
export type FieldGameState = 'exploration' | 'dialogue' | 'combat' | 'cutscene';

export type GameState = GameMode;

export function isFieldGameState(mode: GameMode): mode is FieldGameState {
  return mode !== 'visual-novel';
}
