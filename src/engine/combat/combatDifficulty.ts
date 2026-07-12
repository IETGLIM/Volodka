/* ─── Combat difficulty presets (story / normal / hard) ─── */

export type CombatDifficultyId = 'story' | 'normal' | 'hard';

export const COMBAT_DIFFICULTY_LS_KEY = 'volodka_combat_difficulty';

export interface CombatDifficultyProfile {
  readonly id: CombatDifficultyId;
  readonly label: string;
  readonly enemyDamageMultiplier: number;
  readonly fleeChanceBonus: number;
}

export const COMBAT_DIFFICULTY_PROFILES: Record<CombatDifficultyId, CombatDifficultyProfile> = {
  story: {
    id: 'story',
    label: 'Сюжетный',
    enemyDamageMultiplier: 0.65,
    fleeChanceBonus: 0.2,
  },
  normal: {
    id: 'normal',
    label: 'Обычный',
    enemyDamageMultiplier: 1,
    fleeChanceBonus: 0,
  },
  hard: {
    id: 'hard',
    label: 'Сложный',
    enemyDamageMultiplier: 1.25,
    fleeChanceBonus: -0.05,
  },
};

function parseDifficulty(raw: string | null): CombatDifficultyId {
  if (raw === 'story' || raw === 'hard' || raw === 'normal') return raw;
  return 'normal';
}

export function readCombatDifficulty(): CombatDifficultyId {
  if (typeof localStorage === 'undefined') return 'normal';
  try {
    return parseDifficulty(localStorage.getItem(COMBAT_DIFFICULTY_LS_KEY));
  } catch {
    return 'normal';
  }
}

export function writeCombatDifficulty(id: CombatDifficultyId): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(COMBAT_DIFFICULTY_LS_KEY, id);
  } catch {
    // ignore quota errors
  }
}

export function getCombatDifficultyProfile(id: CombatDifficultyId = readCombatDifficulty()): CombatDifficultyProfile {
  return COMBAT_DIFFICULTY_PROFILES[id];
}

export function scaleEnemyDamageByDifficulty(damage: number, id?: CombatDifficultyId): number {
  const profile = getCombatDifficultyProfile(id);
  return Math.max(1, Math.floor(damage * profile.enemyDamageMultiplier));
}

export function getFleeChanceBonus(id: CombatDifficultyId = readCombatDifficulty()): number {
  return getCombatDifficultyProfile(id).fleeChanceBonus;
}
