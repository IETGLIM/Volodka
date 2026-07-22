/* ─── Volodka RPG – Disco Elysium-style 2d6 dice-roll skill check ─── */

import type { TrainablePlayerSkill } from '@/shared/types/game';
import {
  SeededCombatRng,
  createCombatRngState,
} from '@/engine/combat/combatRng';
import type { SuccessDegree, PartialSuccessEffects, PartialSuccessResult } from '@/engine/narrative/partialSuccessSystem';
import { resolveSuccessDegree, isSuccessDegree } from '@/engine/narrative/partialSuccessSystem';

/* ══════════════════════════════════════════════════════════════
   Types
   ══════════════════════════════════════════════════════════════ */

export interface DiceRollResult {
  /** The two individual die values (each 1–6). */
  dice: [number, number];
  /** Sum of the two dice. */
  total: number;
  /** Combined modifier: base skill level + thought bonuses + situational. */
  modifier: number;
  /** Difficulty Class set by the dialogue designer. */
  dc: number;
  /** Whether the check succeeded (total + modifier ≥ dc, or critical success). */
  success: boolean;
  /** Natural 12 — both dice show 6. Always succeeds. */
  criticalSuccess: boolean;
  /** Natural 2 — both dice show 1. Always fails. */
  criticalFailure: boolean;
  /** total + modifier − dc (positive = exceeded by this much). */
  margin: number;
  /** Partial success degree — Disco Elysium-style granular outcome classification. */
  degree: SuccessDegree;
  /** Partial success effects — bonus/penalty/reduced effects based on degree. */
  partialEffects: PartialSuccessEffects;
}

export interface DiceRollParams {
  /** Which trainable skill is being checked. */
  skill: TrainablePlayerSkill;
  /** Player's base skill level (from PlayerSkills). */
  skillLevel: number;
  /** Difficulty Class (typically 10–16). */
  dc: number;
  /** Thought cabinet bonuses per skill. Only the matching skill's bonus is used. */
  thoughtModifiers?: Record<TrainablePlayerSkill, number>;
  /** Extra bonus/penalty from the specific situation (e.g. wounded = −1). */
  situationalModifier?: number;
  /** Optional seed for deterministic rolls (reuses combat RNG internals). */
  rngSeed?: number;
}

/* ══════════════════════════════════════════════════════════════
   Russian skill labels
   ══════════════════════════════════════════════════════════════ */

export const DICE_SKILL_LABELS: Record<TrainablePlayerSkill, string> = {
  logic: 'Логика',
  coding: 'Код',
  empathy: 'Эмпатия',
  persuasion: 'Убеждение',
  intuition: 'Интуиция',
  writing: 'Письмо',
  rhythm: 'Ритм',
};

/* ══════════════════════════════════════════════════════════════
   Core roll
   ══════════════════════════════════════════════════════════════ */

/** Roll a single d6 using the provided RNG helper (1–6 inclusive). */
function rollD6(rand: () => number): number {
  return 1 + Math.floor(rand() * 6);
}

/**
 * Perform a Disco Elysium–style 2d6 skill check.
 *
 * - Modifier = base skill level + thought cabinet bonus + situational modifier.
 * - Success: 2d6 + modifier ≥ DC.
 * - Critical success: natural 12 (always succeeds).
 * - Critical failure: natural 2 (always fails).
 */
export function performDiceRoll(params: DiceRollParams): DiceRollResult {
  const {
    skill,
    skillLevel = 0,
    dc,
    thoughtModifiers,
    situationalModifier = 0,
    rngSeed,
  } = params;

  // Resolve the RNG source
  const rand: () => number = rngSeed !== undefined
    ? (() => {
        const rng = SeededCombatRng.fromState(createCombatRngState(rngSeed));
        return () => rng.nextFloat();
      })()
    : () => Math.random();

  // Roll the dice
  const d1 = rollD6(rand);
  const d2 = rollD6(rand);
  const dice: [number, number] = [d1, d2];
  const total = d1 + d2;

  // Build modifier = base skill + thought bonus + situational
  const thoughtBonus = (thoughtModifiers?.[skill] ?? 0);
  const modifier = skillLevel + thoughtBonus + situationalModifier;

  // Critical detection
  const criticalSuccess = total === 12;
  const criticalFailure = total === 2;

  // Resolution
  const rawMargin = total + modifier - dc;

  // Partial success degree — Disco Elysium-style granular outcome
  const partialResult = resolveSuccessDegree(
    total,
    modifier,
    dc,
    criticalSuccess,
    criticalFailure,
  );

  // Backward-compatible success boolean: true for all "passing" degrees
  const success = isSuccessDegree(partialResult.degree);
  const margin = rawMargin; // keep negative for failure

  return {
    dice,
    total,
    modifier,
    dc,
    success,
    criticalSuccess,
    criticalFailure,
    margin,
    degree: partialResult.degree,
    partialEffects: partialResult.effects,
  };
}

/* ══════════════════════════════════════════════════════════════
   Probability helper (for UI preview)
   ══════════════════════════════════════════════════════════════ */

/**
 * Returns 0–1 probability of a successful 2d6+modifier ≥ dc check.
 *
 * There are 36 equally-likely outcomes for 2d6.
 * For each pair (d1,d2) we check: critical failure (2) → always fail,
 * critical success (12) → always succeed, otherwise d1+d2+modifier ≥ dc.
 */
export function getSuccessProbability(modifier: number, dc: number): number {
  const target = dc - modifier;
  let successes = 0;

  for (let d1 = 1; d1 <= 6; d1++) {
    for (let d2 = 1; d2 <= 6; d2++) {
      const sum = d1 + d2;
      if (sum === 2) continue;        // critical failure
      if (sum === 12) { successes++; continue; } // critical success
      if (sum >= target) successes++;
    }
  }

  return successes / 36;
}

/* ══════════════════════════════════════════════════════════════
   Formatting helper
   ══════════════════════════════════════════════════════════════ */

/**
 * Format a dice-roll result as a human-readable Russian string.
 *
 * Example: `"2d6[4+3]=7 + Логика[3] + Мысль[+1] = 11 ≥ 10 ✓"`
 */
export function formatDiceRollResult(
  result: DiceRollResult,
  skill: TrainablePlayerSkill,
  skillLevel: number,
  thoughtBonus: number,
): string {
  const { dice, total, modifier, dc, success, criticalSuccess, criticalFailure } = result;
  const skillLabel = DICE_SKILL_LABELS[skill];
  const dStr = `${dice[0]}+${dice[1]}`;

  // Build modifier breakdown parts
  const parts: string[] = [];
  if (skillLevel !== 0) parts.push(`${skillLabel}[${skillLevel > 0 ? '+' : ''}${skillLevel}]`);
  if (thoughtBonus !== 0) parts.push(`Мысль[${thoughtBonus > 0 ? '+' : ''}${thoughtBonus}]`);
  if (result.modifier !== skillLevel + thoughtBonus) {
    const situational = result.modifier - skillLevel - thoughtBonus;
    if (situational !== 0) parts.push(`Обстоятельство[${situational > 0 ? '+' : ''}${situational}]`);
  }

  const modStr = parts.length > 0 ? ` + ${parts.join(' + ')}` : '';
  const finalTotal = total + modifier;
  const cmp = success ? '≥' : '<';

  let icon = success ? '✓' : '✗';
  if (criticalSuccess) icon = '★ КРИТИЧЕСКИЙ УСПЕХ ★';
  else if (criticalFailure) icon = '✗ КРИТИЧЕСКИЙ ПРОВАЛ ✗';

  return `2d6[${dStr}]=${total}${modStr} = ${finalTotal} ${cmp} ${dc} ${icon}`;
}