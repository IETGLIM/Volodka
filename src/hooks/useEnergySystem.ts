'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import { eventBus } from '@/engine/EventBus';

// ============================================
// КОНСТАНТЫ СТОИМОСТИ ЭНЕРГИИ
// ============================================

/** Стоимость действий в единицах энергии */
export const ENERGY_COSTS = {
  choice: 1,       // Обычный выбор
  skillCheck: 2,   // Проверка навыка
  poemGame: 1,     // Стихотворная мини-игра
  dialogue: 0,     // Диалог бесплатный
} as const;

/** Сколько энергии восстанавливается при отдыхе */
const SLEEP_ENERGY_REGEN = 3;

/** Максимальная энергия */
const MAX_ENERGY = 10;

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

  // Реф для отслеживания уведомления об истощении
  const exhaustionNotifiedRef = useRef(false);

  // Определяем уровень энергии
  const energyLevel: EnergySystemAPI['energyLevel'] =
    energy <= 2 ? 'exhausted' :
    energy <= 4 ? 'tired' :
    energy <= 7 ? 'normal' :
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
      if (currentEnergy < MAX_ENERGY) {
        addStat('energy', SLEEP_ENERGY_REGEN);
        eventBus.emit('stat:changed', {
          stat: 'energy',
          oldValue: currentEnergy,
          newValue: Math.min(MAX_ENERGY, currentEnergy + SLEEP_ENERGY_REGEN),
          delta: SLEEP_ENERGY_REGEN,
        });
      }
    }
  }, [currentNodeId, addStat]);

  // Сброс уведомления об истощении, когда энергия восстановилась
  useEffect(() => {
    if (energy > 2) {
      exhaustionNotifiedRef.current = false;
    }
  }, [energy]);

  return {
    energy,
    maxEnergy: MAX_ENERGY,
    consumeEnergy,
    canAfford,
    energyLevel,
  };
}
