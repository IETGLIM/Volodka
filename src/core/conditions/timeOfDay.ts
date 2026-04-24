import type { NarrativeTimeOfDay } from '@/data/types';

const ORDER: Record<NarrativeTimeOfDay, number> = {
  dawn: 0,
  morning: 1,
  afternoon: 2,
  evening: 3,
  night: 4,
};

/** Час обхода (0–24) → фаза для `minTimeOfDay` / `maxTimeOfDay`. */
export function explorationHourToNarrativeTimeOfDay(hour: number): NarrativeTimeOfDay {
  const t = ((hour % 24) + 24) % 24;
  if (t >= 2 && t < 5) return 'dawn';
  if (t >= 5 && t < 10) return 'morning';
  if (t >= 10 && t < 15) return 'afternoon';
  /** До 21:00 считаем «вечер» (в сторе часто `20` как вечер дома). */
  if (t >= 15 && t < 21) return 'evening';
  return 'night';
}

export function narrativeTimeOrder(phase: NarrativeTimeOfDay): number {
  return ORDER[phase];
}

/**
 * Текущая фаза удовлетворяет [min, max] по линейному порядку суток.
 * Если задано только одно поле — проверяется только нижняя или верхняя граница.
 */
export function narrativeTimeInRange(
  current: NarrativeTimeOfDay | undefined,
  min?: NarrativeTimeOfDay,
  max?: NarrativeTimeOfDay,
): boolean {
  if (min === undefined && max === undefined) return true;
  if (current === undefined) return false;
  const c = narrativeTimeOrder(current);
  if (min !== undefined && c < narrativeTimeOrder(min)) return false;
  if (max !== undefined && c > narrativeTimeOrder(max)) return false;
  return true;
}
