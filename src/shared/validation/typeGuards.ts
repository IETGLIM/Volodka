/* ─── Volodka RPG – runtime type guards ─── */

import type { LegacyGamePhase, TrainablePlayerSkill } from '@/shared/types/game';
import type { GamePhase } from '@/shared/gamePhase';

const LEGACY_GAME_PHASES: readonly LegacyGamePhase[] = [
  'menu',
  'intro',
  'exploration',
  'cutscene',
  'combat',
];

const GAME_PHASES: readonly GamePhase[] = LEGACY_GAME_PHASES;

const TRAINABLE_PLAYER_SKILLS: readonly TrainablePlayerSkill[] = [
  'logic',
  'coding',
  'empathy',
  'persuasion',
  'intuition',
  'writing',
  'rhythm',
];

export function isGamePhase(v: unknown): v is GamePhase {
  return typeof v === 'string' && (GAME_PHASES as readonly string[]).includes(v);
}

/** @deprecated Use isGamePhase — kept for story effect payloads. */
export function isGameMode(v: unknown): v is LegacyGamePhase {
  return typeof v === 'string' && (LEGACY_GAME_PHASES as readonly string[]).includes(v);
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
