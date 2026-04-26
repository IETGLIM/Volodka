'use client';

import { useCallback } from 'react';
import { useGameStore } from '@/state/gameStore';
import { MAX_PLAYER_ENERGY } from '@/lib/energyConfig';

/**
 * Фасад над действиями с энергией.
 * Пока делегирует в gameStore; позже — в playerStore + energyService.
 */
export function useEnergyActions() {
  const getEnergy = useCallback(() => useGameStore.getState().playerState.energy, []);

  const canAfford = useCallback(
    (amount: number): boolean => {
      return useGameStore.getState().playerState.energy >= amount;
    },
    []
  );

  const consumeEnergy = useCallback((amount: number): boolean => {
    const state = useGameStore.getState();
    const currentEnergy = state.playerState.energy;
    if (currentEnergy < amount) {
      state.addStress(5);
      return false;
    }
    state.addStat('energy', -amount);
    return true;
  }, []);

  return { getEnergy, canAfford, consumeEnergy, maxEnergy: MAX_PLAYER_ENERGY };
}
