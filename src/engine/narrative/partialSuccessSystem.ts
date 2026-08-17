/* ─── Volodka RPG – Partial Success System ───
   Disco Elysium-style success degrees for dice rolls:
   Instead of binary pass/fail, skill checks produce degrees of success:
   - Critical success (natural 12 OR margin ≥ 6): spectacular outcome + bonus effects
   - Strong success (margin ≥ 4): good outcome + mild bonus
   - Success (margin ≥ 0): standard outcome — baseline pass
   - Marginal success (margin ≥ -2): barely passed — reduced/half effects
   - Failure (margin < -2): normal fail
   - Disastrous failure (natural 2 OR margin ≤ -6): catastrophic outcome + penalty
*/

/* ══════════════════════════════════════════════════════════════
   Types
   ══════════════════════════════════════════════════════════════ */

export type SuccessDegree =
  | 'critical_success'
  | 'strong_success'
  | 'success'
  | 'marginal_success'
  | 'failure'
  | 'disastrous_failure';

export interface PartialSuccessEffects {
  /** For strong/critical success: bonus effects (extra flag set, bonus relation, bonus XP). */
  bonusEffects?: string[];
  /** For marginal success: reduced effects (half XP, partial flag instead of full flag). */
  reducedEffects?: boolean;
  /** For disastrous failure: extra negative consequences (reduced relation, penalty flag). */
  penaltyEffects?: string[];
  /** Narrative flavor text for each degree — shown in the dice roll result display. */
  flavorText?: string;
}

export interface PartialSuccessResult {
  /** The computed degree of success. */
  degree: SuccessDegree;
  /** How much the roll exceeded/missed the DC (rollTotal + modifier - dc). */
  margin: number;
  /** The effects to apply based on the success degree. */
  effects: PartialSuccessEffects;
}

/* ══════════════════════════════════════════════════════════════
   Russian labels for UI display
   ══════════════════════════════════════════════════════════════ */

export const SUCCESS_DEGREE_LABELS: Record<SuccessDegree, string> = {
  critical_success: 'Критический успех!',
  strong_success: 'Яркий успех!',
  success: 'Успех',
  marginal_success: 'Слабый успех...',
  failure: 'Провал',
  disastrous_failure: 'Катастрофический провал!',
};

/** Color mapping for each success degree — used in DiceRollDisplay. */
export const SUCCESS_DEGREE_COLORS: Record<SuccessDegree, string> = {
  critical_success: '#fbbf24', // gold
  strong_success: '#10b981',   // emerald
  success: '#06b6d4',          // cyan
  marginal_success: '#f59e0b', // amber
  failure: '#ef4444',          // red
  disastrous_failure: '#991b1b', // dark red
};

/* ══════════════════════════════════════════════════════════════
   Core resolver
   ══════════════════════════════════════════════════════════════ */

/**
 * Resolve success degree from dice roll result.
 *
 * Margin thresholds:
 * - Natural 12 → critical_success (always, regardless of margin)
 * - Margin >= 6 → critical_success
 * - Margin >= 4 → strong_success (passing with flair)
 * - Margin >= 0 → success (normal pass)
 * - Margin >= -2 → marginal_success (barely passed — half effects)
 * - Margin < -2 → failure (normal fail)
 * - Natural 2 → disastrous_failure (always, regardless of margin)
 * - Margin <= -6 → disastrous_failure
 *
 * "Success" in this system means "the check is considered passed" for
 * degrees: critical_success, strong_success, success, and marginal_success.
 * "Failure" means the check is not passed for: failure, disastrous_failure.
 *
 * This is compatible with the existing DiceRollResult.success boolean:
 * success = degree is one of [critical_success, strong_success, success, marginal_success]
 */
export function resolveSuccessDegree(
  rollTotal: number,
  modifier: number,
  dc: number,
  isNatural12: boolean,
  isNatural2: boolean,
): PartialSuccessResult {
  const margin = rollTotal + modifier - dc;

  // Natural extremes override everything
  if (isNatural12) {
    return {
      degree: 'critical_success',
      margin,
      effects: {
        bonusEffects: ['natural_12'],
        reducedEffects: false,
        flavorText: 'Оба кубика — шестёрки. Судьба на вашей стороне.',
      },
    };
  }

  if (isNatural2) {
    return {
      degree: 'disastrous_failure',
      margin,
      effects: {
        penaltyEffects: ['natural_2'],
        reducedEffects: false,
        flavorText: 'Оба кубика — единицы. Провал неминуем.',
      },
    };
  }

  // Determine degree by margin thresholds
  let degree: SuccessDegree;
  let effects: PartialSuccessEffects;

  if (margin >= 6) {
    degree = 'critical_success';
    effects = {
      bonusEffects: ['margin_6_plus'],
      reducedEffects: false,
      flavorText: 'Высокий успех — далеко за пределами необходимого.',
    };
  } else if (margin >= 4) {
    degree = 'strong_success';
    effects = {
      bonusEffects: ['margin_4_plus'],
      reducedEffects: false,
      flavorText: 'Яркий успех — вы прошли с запасом.',
    };
  } else if (margin >= 0) {
    degree = 'success';
    effects = {
      reducedEffects: false,
      flavorText: 'Стандартный успех — вы прошли проверку.',
    };
  } else if (margin >= -2) {
    degree = 'marginal_success';
    effects = {
      reducedEffects: true,
      flavorText: 'Слабый успех — вы кое-как прошли, но результаты ограничены.',
    };
  } else if (margin > -6) {
    degree = 'failure';
    effects = {
      flavorText: 'Провал — вы не прошли проверку.',
    };
  } else {
    degree = 'disastrous_failure';
    effects = {
      penaltyEffects: ['margin_minus_6'],
      reducedEffects: false,
      flavorText: 'Катастрофический провал — всё пошло прахом.',
    };
  }

  return { degree, margin, effects };
}

/* ══════════════════════════════════════════════════════════════
   Helpers
   ══════════════════════════════════════════════════════════════ */

/** Check if a degree counts as "passed" (for backward compatibility with DiceRollResult.success). */
export function isSuccessDegree(degree: SuccessDegree): boolean {
  return degree === 'critical_success'
    || degree === 'strong_success'
    || degree === 'success'
    || degree === 'marginal_success';
}

/** Get the Russian label for a success degree. */
export function getSuccessDegreeLabel(degree: SuccessDegree): string {
  return SUCCESS_DEGREE_LABELS[degree];
}

/** Get the CSS color for a success degree. */
export function getSuccessDegreeColor(degree: SuccessDegree): string {
  return SUCCESS_DEGREE_COLORS[degree];
}

/**
 * Resolve which effects to apply based on success degree and choice-defined effect lists.
 *
 * - critical/strong_success → base effects + strongSuccessEffects + bonusEffects from degree
 * - success → base effects only
 * - marginal_success → base effects with reducedEffects flag (half XP, partial flags)
 * - failure → no base effects
 * - disastrous_failure → penaltyEffects from choice + penaltyEffects from degree
 */
export function resolveChoiceEffectsByDegree(
  baseEffects: string[] | undefined,
  choicePartialSuccessEffects: string[] | undefined,
  choiceStrongSuccessEffects: string[] | undefined,
  choiceDisastrousFailureEffects: string[] | undefined,
  degree: PartialSuccessResult,
): {
  applyEffects: string[];
  reducedEffects: boolean;
} {
  switch (degree.degree) {
    case 'critical_success':
      return {
        applyEffects: [
          ...(baseEffects ?? []),
          ...(choiceStrongSuccessEffects ?? []),
          ...(degree.effects.bonusEffects ?? []),
        ],
        reducedEffects: false,
      };
    case 'strong_success':
      return {
        applyEffects: [
          ...(baseEffects ?? []),
          ...(choiceStrongSuccessEffects ?? []),
        ],
        reducedEffects: false,
      };
    case 'success':
      return {
        applyEffects: [...(baseEffects ?? [])],
        reducedEffects: false,
      };
    case 'marginal_success':
      return {
        applyEffects: [...(baseEffects ?? []), ...(choicePartialSuccessEffects ?? [])],
        reducedEffects: true,
      };
    case 'failure':
      return {
        applyEffects: [],
        reducedEffects: false,
      };
    case 'disastrous_failure':
      return {
        applyEffects: [
          ...(choiceDisastrousFailureEffects ?? []),
          ...(degree.effects.penaltyEffects ?? []),
        ],
        reducedEffects: false,
      };
    default:
      return {
        applyEffects: [...(baseEffects ?? [])],
        reducedEffects: false,
      };
  }
}
