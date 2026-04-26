'use client';

import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from '@/state';

/**
 * Плоский срез состояния игрока.
 * Пока читает из gameStore; после миграции — напрямую из playerStore.
 */
export function usePlayerState() {
  return useGameStore(
    useShallow((s) => {
      const p = s.playerState;
      return {
        // Основные статы
        mood: p.mood,
        creativity: p.creativity,
        stability: p.stability,
        energy: p.energy,
        karma: p.karma,
        selfEsteem: p.selfEsteem,
        stress: p.stress,
        panicMode: p.panicMode,
        // Навыки
        skills: p.skills,
        skillPoints: p.skills.skillPoints,
        // Уровень и опыт
        characterLevel: p.characterLevel,
        experience: p.experience,
        experienceToNextLevel: p.experienceToNextLevel,
        // Флаги
        flags: p.flags,
        // Коллекции
        poemsCollected: p.poemsCollected,
        collections: p.collections,
        // Статистика
        statistics: p.statistics,
        // Посещённые узлы
        visitedNodes: p.visitedNodes,
        // Акт
        act: p.act,
        // Таймеры паники
        panicTimers: p.panicTimers,
        // Экипировка (если есть)
        equippedItemIds: p.equippedItemIds ?? [],
      };
    })
  );
}
