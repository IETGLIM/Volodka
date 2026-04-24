'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useGameStore } from '@/state/gameStore';
import { eventBus } from '@/engine/EventBus';
import {
  MAX_PLAYER_ENERGY,
  PASSIVE_ENERGY_AMOUNT,
  PASSIVE_ENERGY_REGEN_MS,
  SLEEP_ENERGY_REGEN,
} from '@/lib/energyConfig';

export { ENERGY_COSTS } from '@/lib/energyConfig';

// ============================================
// ТИПЫ
// ============================================

export interface EnergySystemAPI {
  /** Текущий уровень энергии */
  energy: number;
  /** Максимальная энергия */
  maxEnergy: number;
  /** Потратить энергию. Возвращает false если недостаточно */
  consumeEnergy: (amount: number) => boolean;
  /** Проверить, достаточно ли энергии */
  canAfford: (amount: number) => boolean;
  /** Уровень энергии: истощён / устал / нормальный / бодрый */
  energyLevel: 'exhausted' | 'tired' | 'normal' | 'energized';
}

// ============================================
// ХУК
// ============================================

export function useEnergySystem(): EnergySystemAPI {
  const energy = useGameStore(s => s.playerState.energy);
  const addStat = useGameStore(s => s.addStat);
  const addStress = useGameStore(s => s.addStress);
  const currentNodeId = useGameStore(s => s.currentNodeId);
  const phase = useGameStore(s => s.phase);

  // Реф для отслеживания уведомления об истощении
  const exhaustionNotifiedRef = useRef(false);

  const m = MAX_PLAYER_ENERGY;
  const energyLevel: EnergySystemAPI['energyLevel'] =
    energy <= Math.max(2, Math.ceil(m * 0.12)) ? 'exhausted' :
    energy <= Math.ceil(m * 0.33) ? 'tired' :
    energy <= Math.ceil(m * 0.66) ? 'normal' :
    'energized';

  // Проверка доступности энергии
  const canAfford = useCallback((amount: number): boolean => {
    return energy >= amount;
  }, [energy]);

  // Трата энергии
  const consumeEnergy = useCallback((amount: number): boolean => {
    if (energy < amount) {
      // Недостаточно энергии — добавляем стресс
      addStress(5);
      eventBus.emit('stat:changed', {
        stat: 'energy',
        oldValue: energy,
        newValue: energy,
        delta: 0,
      });
      return false;
    }

    const oldValue = energy;
    const newEnergy = Math.max(0, energy - amount);

    // Применяем через store action
    addStat('energy', -amount);

    // Оповещаем об изменении
    eventBus.emit('stat:changed', {
      stat: 'energy',
      oldValue,
      newValue: newEnergy,
      delta: -amount,
    });

    // Если энергия упала до 0 — стресс и уведомление
    if (newEnergy === 0 && !exhaustionNotifiedRef.current) {
      exhaustionNotifiedRef.current = true;
      addStress(10);
      eventBus.emit('stress:threshold', { level: 25, stress: useGameStore.getState().playerState.stress });
    }

    return true;
  }, [energy, addStat, addStress]);

  // Регенерация энергии на узлах со 'sleep' в ID
  useEffect(() => {
    if (currentNodeId && currentNodeId.toLowerCase().includes('sleep')) {
      const currentEnergy = useGameStore.getState().playerState.energy;
      if (currentEnergy < MAX_PLAYER_ENERGY) {
        addStat('energy', SLEEP_ENERGY_REGEN);
        eventBus.emit('stat:changed', {
          stat: 'energy',
          oldValue: currentEnergy,
          newValue: Math.min(MAX_PLAYER_ENERGY, currentEnergy + SLEEP_ENERGY_REGEN),
          delta: SLEEP_ENERGY_REGEN,
        });
      }
    }
  }, [currentNodeId, addStat]);

  // Пассивное восстановление в активной игре — не копится в меню/интро
  useEffect(() => {
    if (phase !== 'game') return;
    const id = setInterval(() => {
      const currentEnergy = useGameStore.getState().playerState.energy;
      if (currentEnergy >= MAX_PLAYER_ENERGY) return;
      addStat('energy', PASSIVE_ENERGY_AMOUNT);
      eventBus.emit('stat:changed', {
        stat: 'energy',
        oldValue: currentEnergy,
        newValue: Math.min(MAX_PLAYER_ENERGY, currentEnergy + PASSIVE_ENERGY_AMOUNT),
        delta: PASSIVE_ENERGY_AMOUNT,
      });
    }, PASSIVE_ENERGY_REGEN_MS);
    return () => clearInterval(id);
  }, [addStat, phase]);

  // Сброс уведомления об истощении, когда энергия восстановилась
  useEffect(() => {
    if (energy > Math.ceil(MAX_PLAYER_ENERGY * 0.25)) {
      exhaustionNotifiedRef.current = false;
    }
  }, [energy]);

  return {
    energy,
    maxEnergy: MAX_PLAYER_ENERGY,
    consumeEnergy,
    canAfford,
    energyLevel,
  };
}
