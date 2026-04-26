'use client';

import { useCallback } from 'react';
import { useGameStore } from '@/state';
import { MAX_PLAYER_ENERGY } from '@/lib/energyConfig';

/**
 * Фасад над действиями с энергией.
 * Пока делегирует в gameStore; позже — напрямую в playerStore.
 */
export function useEnergyActions() {
  const canAfford = useCallback((amount: number): boolean => {
    return useGameStore.getState().playerState.energy >= amount;
  }, []);

  const consumeEnergy = useCallback((amount: number): boolean => {
    const state = useGameStore.getState();
    if (state.playerState.energy < amount) {
      state.addStress(5);
      return false;
    }
    state.addStat('energy', -amount);
    return true;
  }, []);

  return { canAfford, consumeEnergy, maxEnergy: MAX_PLAYER_ENERGY };
}
