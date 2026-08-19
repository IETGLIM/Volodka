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

/** Scale enemy damage by difficulty preset, current act, and player level.
 *
 *  Formula: damage * difficultyMult * (1 + 0.15 * (act - 1)) * (1 + 0.1 * max(0, level - 1))
 *
 *  At Act 1 / Level 1 the factor is 1.0 (no change).
 *  At Act 5 / Level 10 the factor is 3.04 (1.6 × 1.9) on Normal difficulty.
 */
export function scaleEnemyDamageByDifficulty(
  damage: number,
  id?: CombatDifficultyId,
  actNumber?: number,
  playerLevel?: number,
): number {
  const difficultyFactor = resolveDifficultyMultiplier(id);

  // Act scaling: +15% per act beyond the first
  const actFactor = 1 + 0.15 * Math.max(0, (actNumber ?? 1) - 1);

  // Level scaling: +10% per player level beyond the first
  const levelFactor = 1 + 0.1 * Math.max(0, (playerLevel ?? 1) - 1);

  return Math.max(1, Math.floor(damage * difficultyFactor * actFactor * levelFactor));
}

/** Compute the act+level scaling multiplier used for enemy base stats.
 *
 *  This is the same factor applied in `scaleEnemyDamageByDifficulty` but
 *  without the difficulty preset — used when constructing the enemy object
 *  so that HP, attack, defense, etc. all scale together.
 */
export function computeEnemyScalingFactor(actNumber: number, playerLevel: number): number {
  const actFactor = 1 + 0.15 * Math.max(0, actNumber - 1);
  const levelFactor = 1 + 0.1 * Math.max(0, playerLevel - 1);
  return actFactor * levelFactor;
}

export function getFleeChanceBonus(id: CombatDifficultyId = readCombatDifficulty()): number {
  return getCombatDifficultyProfile(id).fleeChanceBonus;
}

// ── User-facing difficulty integration ──────────────────────────────────────
// The 5-level difficultySlice (saved with the game, set via SettingsPanel) is
// the user-facing difficulty system. The 3-level combatDifficulty above is
// legacy (localStorage; no in-game UI writes it, so it stays at 'normal'=1.0).
//
// Previously scaleEnemyDamageByDifficulty used ONLY the legacy 3-level factor,
// while basic attacks additionally applied the difficultySlice multiplier
// (enemyTurn.ts). Net effect: boss specials completely ignored the user's
// chosen difficulty, and basic attacks were scaled by both systems.
//
// To fix this with a single source of truth — without a hard store import that
// would violate engine→store layering and break unit-test isolation — the store
// layer registers a multiplier getter here at app boot (see
// bindApplicationLayers). When no legacy `id` is explicitly passed, the
// registered getter is consulted so the user's chosen difficulty scales ALL
// enemy damage (basic attacks AND boss specials) uniformly.

let difficultySliceMultiplierGetter: (() => number) | null = null;

/** Register a getter for the user-facing 5-level difficulty multiplier.
 *  Called once at app boot from the bootstrap layer. Pass null to unregister
 *  (used by test reset helpers). */
export function registerDifficultySliceMultiplierGetter(getter: (() => number) | null): void {
  difficultySliceMultiplierGetter = getter;
}

function resolveDifficultyMultiplier(id?: CombatDifficultyId): number {
  // Explicit legacy id (tests, explicit callers) → 3-level profile.
  if (id !== undefined) return getCombatDifficultyProfile(id).enemyDamageMultiplier;
  // Otherwise prefer the user-facing 5-level difficultySlice.
  if (difficultySliceMultiplierGetter) {
    try {
      return difficultySliceMultiplierGetter();
    } catch {
      // store not bound yet (tests, early boot) → fall through to safe default
    }
  }
  return 1; // safe default (normal)
}
