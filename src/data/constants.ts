/* ─── Volodka RPG – global constants ─── */

import type { PlayerSkills } from '@/shared/types/game';

/** Default player name */
export const INITIAL_PLAYER_NAME = 'Володька';

/** Starting karma value (0–100) */
export const INITIAL_KARMA = 50;

/** Starting energy value (0–100) */
export const INITIAL_ENERGY = 80;

/** Starting stress value (0–100) */
export const INITIAL_STRESS = 10;

/** Karma at or above this value is considered "high" */
export const KARMA_HIGH_THRESHOLD = 65;

/** Karma at or below this value is considered "low" */
export const KARMA_LOW_THRESHOLD = 35;

/** Main story acts (act1–act7). Must stay in sync with STORY_PACK_ORDER minus epilogue packs. */
export const MAX_STORY_ACT = 7;

/** Target visual height of the player GLB model in meters */
export const PLAYER_GLB_TARGET_VISUAL_METERS = 1.75;

/** Fallback visual height when the model cannot be measured */
export const PLAYER_VISUAL_HEIGHT_FALLBACK_M = 1.75;

/** Y position where the player's feet should spawn */
export const PLAYER_FEET_SPAWN_Y = 0.01;

/** Maximum inventory slots the player can hold */
export const MAX_INVENTORY_SLOTS = 24;

/** How often the game auto-saves (ms) — every 5 minutes */
export const AUTO_SAVE_INTERVAL_MS = 300_000;

/** Default player skills at the start of the game */
export const DEFAULT_SKILLS: PlayerSkills = {
  logic: 10,
  coding: 12,
  empathy: 8,
  persuasion: 6,
  intuition: 7,
  writing: 5,
  rhythm: 5,
};
