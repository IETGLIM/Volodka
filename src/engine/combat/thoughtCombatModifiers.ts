/* ─── Volodka RPG – Thought→Combat Modifier Bridge ───
   Equipped thoughts influence combat stats the same way they affect
   dialogue dice rolls — unifying thought influence across all game modes,
   like Disco Elysium where personality traits affect everything. */

import type { ThoughtCabinetItem, TrainablePlayerSkill } from '@/shared/types/game';

/* ═══════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════ */

/** How a thought modifies combat performance. */
export interface ThoughtCombatEffect {
  /** Additive bonus to player attack. */
  attackBonus: number;
  /** Additive bonus to player defense. */
  defenseBonus: number;
  /** Additive bonus to crit chance (%). */
  critChanceBonus: number;
  /** Additive bonus to max HP. */
  hpBonus: number;
  /** Additive bonus to flee chance (%). */
  fleeChanceBonus: number;
  /** Multiplicative bonus to combo multiplier. */
  comboMultiplier: number;
  /** Unlocks a special combat action (e.g. beat_sync). */
  specialUnlock?: string;
  /** Flavor text describing why the thought affects this stat. */
  description: string;
}

/* ═══════════════════════════════════════════════════════════════
   Constants — voice→combat mapping + caps
   ═══════════════════════════════════════════════════════════════ */

/** Per-thought contribution based on its voice skill.
 *  Each thought adds ONE primary bonus, determined by its voice. */
const VOICE_COMBAT_MAP: Record<
  TrainablePlayerSkill,
  {
    field: keyof Pick<ThoughtCombatEffect, 'attackBonus' | 'defenseBonus' | 'critChanceBonus' | 'hpBonus' | 'fleeChanceBonus' | 'comboMultiplier'>;
    value: number;
    description: string;
  }
> = {
  logic: {
    field: 'defenseBonus',
    value: 0.3,
    description: 'Логический анализ помогает предвидеть удары',
  },
  coding: {
    field: 'attackBonus',
    value: 0.4,
    description: 'Хакерский подход — каждый удар как exploit',
  },
  empathy: {
    field: 'fleeChanceBonus',
    value: 5,
    description: 'Эмпатия подсказывает — лучше отступить',
  },
  persuasion: {
    field: 'comboMultiplier',
    value: 0.1,
    description: 'Риторическая стратегия — каждый удар складывается в аргумент',
  },
  intuition: {
    field: 'critChanceBonus',
    value: 3,
    description: 'Интуиция чувствует слабое место',
  },
  writing: {
    field: 'hpBonus',
    value: 5,
    description: 'Стихи дают силы продолжать',
  },
  rhythm: {
    field: 'comboMultiplier',
    value: 0.05,
    description: 'Ритм — ключ к сражению',
  },
};

/** Maximum values for each bonus — prevents stacking from being overpowered. */
const CAPS: Record<string, number> = {
  attackBonus: 1.5,
  defenseBonus: 1.5,
  critChanceBonus: 15,
  hpBonus: 15,
  fleeChanceBonus: 25,
  comboMultiplier: 0.5, // max additional combo multiplier
};

/* ═══════════════════════════════════════════════════════════════
   Resolver
   ═══════════════════════════════════════════════════════════════ */

/**
 * Resolve combat effects from all currently equipped thoughts.
 *
 * Each thought contributes based on its voice skill:
 * - logic   → +0.3 defense   (analytical, defensive)
 * - coding  → +0.4 attack    (hacking, offensive)
 * - empathy → +5% flee       (compassionate, avoidant)
 * - persuasion → +0.1 combo  (rhetorical, strategic)
 * - intuition → +3% crit     (perceptive, lucky)
 * - writing → +5 HP          (poetic resilience)
 * - rhythm  → +0.05 combo + unlocks beat_sync special action
 *
 * Multiple thoughts stack, but each bonus is capped at the values
 * defined in CAPS. The bonuses are small and add flavor rather than
 * being game-breaking — consistent with the Disco Elysium philosophy.
 */
export function resolveThoughtCombatEffects(
  equippedThoughts: ThoughtCabinetItem[],
): ThoughtCombatEffect {
  // Start with zero baseline
  const result: ThoughtCombatEffect = {
    attackBonus: 0,
    defenseBonus: 0,
    critChanceBonus: 0,
    hpBonus: 0,
    fleeChanceBonus: 0,
    comboMultiplier: 0,
    description: '',
  };

  const descriptions: string[] = [];
  let hasRhythmThought = false;

  for (const thought of equippedThoughts) {
    const mapping = VOICE_COMBAT_MAP[thought.voice];
    if (!mapping) continue;

    // Accumulate the bonus into the appropriate field
    result[mapping.field] += mapping.value;

    // Track rhythm for special action unlock
    if (thought.voice === 'rhythm') {
      hasRhythmThought = true;
    }

    // Collect per-thought description for aggregate flavor text
    descriptions.push(`[${thought.name}] ${mapping.description}`);
  }

  // Apply caps to prevent stacking from being overpowered
  result.attackBonus = Math.min(result.attackBonus, CAPS.attackBonus);
  result.defenseBonus = Math.min(result.defenseBonus, CAPS.defenseBonus);
  result.critChanceBonus = Math.min(result.critChanceBonus, CAPS.critChanceBonus);
  result.hpBonus = Math.min(result.hpBonus, CAPS.hpBonus);
  result.fleeChanceBonus = Math.min(result.fleeChanceBonus, CAPS.fleeChanceBonus);
  result.comboMultiplier = Math.min(result.comboMultiplier, CAPS.comboMultiplier);

  // Unlock beat_sync special combat action when a rhythm thought is equipped
  if (hasRhythmThought) {
    result.specialUnlock = 'beat_sync';
  }

  // Aggregate flavor text — semicolon-separated per-thought descriptions
  result.description = descriptions.join('; ');

  return result;
}

/* ═══════════════════════════════════════════════════════════════
   Per-thought detail resolver (for UI display)
   ═══════════════════════════════════════════════════════════════ */

/** Individual thought→combat contribution, for showing badges in UI. */
export interface ThoughtCombatContribution {
  thoughtId: string;
  thoughtName: string;
  voice: TrainablePlayerSkill;
  /** Which stat this thought modifies. */
  field: string;
  /** The bonus value (raw, before capping). */
  value: number;
  /** Human-readable label for the bonus (e.g. "+0.4 Атака"). */
  label: string;
  /** Flavor description. */
  description: string;
}

/** Russian labels for each combat field. */
const FIELD_LABELS: Record<string, string> = {
  attackBonus: 'Атака',
  defenseBonus: 'Защита',
  critChanceBonus: 'Крит',
  hpBonus: 'HP',
  fleeChanceBonus: 'Побег',
  comboMultiplier: 'Комбо',
};

/** Format the bonus value for display. */
function formatBonusValue(field: string, value: number): string {
  if (field === 'critChanceBonus' || field === 'fleeChanceBonus') {
    return `+${value}%`;
  }
  if (field === 'comboMultiplier') {
    return `+${value}×`;
  }
  if (field === 'hpBonus') {
    return `+${value}`;
  }
  // attackBonus, defenseBonus — fractional values shown with 1 decimal
  return `+${value.toFixed(1)}`;
}

/**
 * Resolve individual per-thought combat contributions.
 * Used by UI to show thought badges (e.g. "[Серверный Шёпот] +0.4 Атака").
 * Returns only thoughts that have non-zero combat effects.
 */
export function resolveThoughtCombatContributions(
  equippedThoughts: ThoughtCabinetItem[],
): ThoughtCombatContribution[] {
  const contributions: ThoughtCombatContribution[] = [];

  for (const thought of equippedThoughts) {
    const mapping = VOICE_COMBAT_MAP[thought.voice];
    if (!mapping) continue;

    contributions.push({
      thoughtId: thought.id,
      thoughtName: thought.name,
      voice: thought.voice,
      field: mapping.field,
      value: mapping.value,
      label: `${formatBonusValue(mapping.field, mapping.value)} ${FIELD_LABELS[mapping.field]}`,
      description: mapping.description,
    });

    // Rhythm thoughts also get a special action contribution
    if (thought.voice === 'rhythm') {
      contributions.push({
        thoughtId: thought.id,
        thoughtName: thought.name,
        voice: thought.voice,
        field: 'specialUnlock',
        value: 1,
        label: '⚡ Ритм-Синхронизация',
        description: 'Ритм — ключ к сражению',
      });
    }
  }

  return contributions;
}

/** Check whether thought effects have any non-zero bonuses. */
export function hasThoughtCombatEffects(effect: ThoughtCombatEffect): boolean {
  return (
    effect.attackBonus > 0 ||
    effect.defenseBonus > 0 ||
    effect.critChanceBonus > 0 ||
    effect.hpBonus > 0 ||
    effect.fleeChanceBonus > 0 ||
    effect.comboMultiplier > 0 ||
    effect.specialUnlock !== undefined
  );
}
