/* ─── Volodka RPG – Difficulty Slice ─── */
/* Global difficulty settings that affect combat, skill checks, stress,
 * energy regen, XP/credits, and flee chances.
 * Persisted with save data. */

import type { StateCreator } from 'zustand';
import type { GameStoreState } from '../types';

/* ─── Difficulty identity ─── */

export type GameDifficulty = 'story' | 'easy' | 'normal' | 'hard' | 'nightmare';

export const GAME_DIFFICULTY_ORDER: readonly GameDifficulty[] = [
  'story', 'easy', 'normal', 'hard', 'nightmare',
] as const;

/* ─── Settings per difficulty ─── */

export interface DifficultySettings {
  difficulty: GameDifficulty;
  /** Damage received from enemies (0.5 – 2.0) */
  enemyDamageMultiplier: number;
  /** Enemy health pool scaling (0.7 – 2.5) */
  enemyHealthMultiplier: number;
  /** Damage dealt by the player (0.5 – 1.5) */
  playerDamageMultiplier: number;
  /** XP gained from all sources (0.7 – 1.5) */
  xpMultiplier: number;
  /** Credits gained from all sources (0.7 – 1.5) */
  creditsMultiplier: number;
  /** Skill check threshold offset: lower = easier (-2 to +2). Positive = harder. */
  skillCheckThreshold: number;
  /** Stress accumulation rate (0.5 – 2.0). Applied as multiplier. */
  stressAccumulationRate: number;
  /** Energy regen rate (0.5 – 2.0). Applied as multiplier. */
  energyRegenRate: number;
  /** Base flee chance from combat (0.1 – 0.5) */
  combatFleeBaseChance: number;
}

/* ─── Presets ─── */

export const DIFFICULTY_PRESETS: Record<GameDifficulty, DifficultySettings> = {
  story: {
    difficulty: 'story',
    enemyDamageMultiplier: 0.5,
    enemyHealthMultiplier: 0.7,
    playerDamageMultiplier: 1.5,
    xpMultiplier: 1.0,
    creditsMultiplier: 1.0,
    skillCheckThreshold: -2,
    stressAccumulationRate: 0.5,
    energyRegenRate: 2.0,
    combatFleeBaseChance: 0.5,
  },
  easy: {
    difficulty: 'easy',
    enemyDamageMultiplier: 0.7,
    enemyHealthMultiplier: 0.8,
    playerDamageMultiplier: 1.3,
    xpMultiplier: 1.0,
    creditsMultiplier: 1.0,
    skillCheckThreshold: -1,
    stressAccumulationRate: 0.7,
    energyRegenRate: 1.5,
    combatFleeBaseChance: 0.4,
  },
  normal: {
    difficulty: 'normal',
    enemyDamageMultiplier: 1.0,
    enemyHealthMultiplier: 1.0,
    playerDamageMultiplier: 1.0,
    xpMultiplier: 1.0,
    creditsMultiplier: 1.0,
    skillCheckThreshold: 0,
    stressAccumulationRate: 1.0,
    energyRegenRate: 1.0,
    combatFleeBaseChance: 0.3,
  },
  hard: {
    difficulty: 'hard',
    enemyDamageMultiplier: 1.5,
    enemyHealthMultiplier: 1.5,
    playerDamageMultiplier: 0.8,
    xpMultiplier: 1.2,
    creditsMultiplier: 1.2,
    skillCheckThreshold: 1,
    stressAccumulationRate: 1.5,
    energyRegenRate: 0.7,
    combatFleeBaseChance: 0.2,
  },
  nightmare: {
    difficulty: 'nightmare',
    enemyDamageMultiplier: 2.0,
    enemyHealthMultiplier: 2.5,
    playerDamageMultiplier: 0.6,
    xpMultiplier: 1.5,
    creditsMultiplier: 1.5,
    skillCheckThreshold: 2,
    stressAccumulationRate: 2.0,
    energyRegenRate: 0.5,
    combatFleeBaseChance: 0.1,
  },
};

/* ─── Russian metadata for UI ─── */

export const DIFFICULTY_META: Record<GameDifficulty, {
  name: string;
  description: string;
  icon: string;
  color: string;
  glowColor: string;
  dangerLevel: number; // 0–4
}> = {
  story: {
    name: 'Сюжетный',
    description: 'Фокус на нарративе. Боёвки прощают ошибки, навыки не требуются.',
    icon: '📖',
    color: '#f59e0b',     // amber
    glowColor: 'rgba(245, 158, 11, 0.3)',
    dangerLevel: 0,
  },
  easy: {
    name: 'Лёгкий',
    description: 'Расслабленное приключение. Враги слабее, навыки чуть легче.',
    icon: '🛡️',
    color: '#22c55e',     // green
    glowColor: 'rgba(34, 197, 94, 0.25)',
    dangerLevel: 1,
  },
  normal: {
    name: 'Обычный',
    description: 'Сбалансированный опыт. Рекомендуется для первого прохождения.',
    icon: '⚖️',
    color: '#06b6d4',     // cyan
    glowColor: 'rgba(6, 182, 212, 0.25)',
    dangerLevel: 2,
  },
  hard: {
    name: 'Сложный',
    description: 'Требует мастерства. Враги сильнее, стресс накапливается быстрее.',
    icon: '⚔️',
    color: '#f97316',     // orange
    glowColor: 'rgba(249, 115, 22, 0.3)',
    dangerLevel: 3,
  },
  nightmare: {
    name: 'Кошмар',
    description: 'Персонажи умирают навсегда. Каждый шаг может стать последним.',
    icon: '💀',
    color: '#ef4444',     // red
    glowColor: 'rgba(239, 68, 68, 0.35)',
    dangerLevel: 4,
  },
};

/* ─── Default ─── */

export function createDefaultDifficultySettings(): DifficultySettings {
  return { ...DIFFICULTY_PRESETS.normal };
}

/* ─── Slice types ─── */

export interface DifficultySliceState {
  difficultySettings: DifficultySettings;
}

export interface DifficultySliceActions {
  setGameDifficulty: (difficulty: GameDifficulty) => void;
}

export type DifficultySlice = DifficultySliceState & DifficultySliceActions;

/* ─── Slice creator ─── */

export const createDifficultySlice: StateCreator<
  GameStoreState,
  [],
  [],
  DifficultySlice
> = (set) => ({
  difficultySettings: createDefaultDifficultySettings(),

  setGameDifficulty: (difficulty) =>
    set({
      difficultySettings: { ...DIFFICULTY_PRESETS[difficulty] },
    }),
});

/* ─── Pure helpers (no store dependency) ─── */

/** Map old combat-only difficulty ID to the new GameDifficulty. */
export function mapLegacyCombatDifficulty(
  legacy: string | null | undefined,
): GameDifficulty {
  if (legacy === 'story') return 'story';
  if (legacy === 'hard') return 'hard';
  // 'normal' or anything else maps to 'normal'
  return 'normal';
}

/** Resolve the effective difficulty multiplier from settings.
 *  Returns the legacy CombatDifficultyId for backward compatibility. */
export function toLegacyCombatDifficulty(
  settings: DifficultySettings,
): 'story' | 'normal' | 'hard' {
  switch (settings.difficulty) {
    case 'story': return 'story';
    case 'easy': return 'story';
    case 'normal': return 'normal';
    case 'hard': return 'hard';
    case 'nightmare': return 'hard';
  }
}

/** Scale a stress delta by the difficulty stress accumulation rate. */
export function scaleStressByDifficulty(
  amount: number,
  settings: DifficultySettings,
): number {
  if (amount <= 0) return amount; // Relief passes through unchanged
  return Math.round(amount * settings.stressAccumulationRate);
}

/** Scale an energy regen amount by the difficulty energy regen rate. */
export function scaleEnergyRegenByDifficulty(
  amount: number,
  settings: DifficultySettings,
): number {
  if (amount <= 0) return amount;
  return Math.round(amount * settings.energyRegenRate);
}

/** Scale XP gained by difficulty. */
export function scaleXpByDifficulty(
  amount: number,
  settings: DifficultySettings,
): number {
  return Math.max(1, Math.floor(amount * settings.xpMultiplier));
}

/** Scale credits gained by difficulty. */
export function scaleCreditsByDifficulty(
  amount: number,
  settings: DifficultySettings,
): number {
  return Math.max(1, Math.floor(amount * settings.creditsMultiplier));
}
