// ============================================
// PLAYER STORE — чистые селекторы (derived state)
// ============================================
// Держим вычисления вне объекта Zustand: их можно передать в
// usePlayerStore(s => fn(s)) — подписка сравнивает результат по Object.is,
// примитивы не дают лишних ререндеров. Сложные объекты — useShallow.

import type { PlayerState } from '@/shared/types/game';
import { MAX_PLAYER_ENERGY } from '@/lib/energyConfig';

export function selectEnergyFraction(energy: number): number {
  if (MAX_PLAYER_ENERGY <= 0) return 0;
  return Math.max(0, Math.min(1, energy / MAX_PLAYER_ENERGY));
}

/** 0–100 для UI (полоски, подписи). */
export function selectEnergyPercentage(energy: number): number {
  return selectEnergyFraction(energy) * 100;
}

export function selectEnergyPercentageFromPlayer(player: PlayerState): number {
  return selectEnergyPercentage(player.energy);
}
