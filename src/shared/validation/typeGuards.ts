/* ─── Volodka RPG – runtime type guards ─── */

import type { GameMode, TrainablePlayerSkill } from '@/shared/types/game';

const GAME_MODES: readonly GameMode[] = [
  'menu',
  'intro',
  'exploration',
  'cutscene',
  'combat',
];

const TRAINABLE_PLAYER_SKILLS: readonly TrainablePlayerSkill[] = [
  'logic',
  'coding',
  'empathy',
  'persuasion',
  'intuition',
  'writing',
  'rhythm',
];

export function isGameMode(v: unknown): v is GameMode {
  return typeof v === 'string' && (GAME_MODES as readonly string[]).includes(v);
}

export function isTrainablePlayerSkill(v: unknown): v is TrainablePlayerSkill {
  return (
    typeof v === 'string' &&
    (TRAINABLE_PLAYER_SKILLS as readonly string[]).includes(v)
  );
}

/** Log a dev warning when a guard rejects a value (never silent in dev). */
export function warnInvalidValue(context: string, value: unknown): void {
  if (import.meta.env.DEV) {
    console.warn(`[TypeGuard] Invalid ${context}: ${JSON.stringify(value)}`);
  }
}
