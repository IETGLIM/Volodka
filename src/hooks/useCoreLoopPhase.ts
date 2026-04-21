'use client';

import { useState, useEffect, useCallback } from 'react';
import { eventBus } from '@/engine/EventBus';
import type { CoreLoopState } from '@/engine/CoreLoop';
import type { EventMap } from '@/engine/events/EventBus';

// ============================================
// ТИПЫ
// ============================================

export type CoreLoopPhase =
  | 'EXPLORING'
  | 'IN_DIALOGUE'
  | 'MAKING_CHOICE'
  | 'PROCESSING_CONSEQUENCES'
  | 'PROGRESSING'
  | 'NEW_OPPORTUNITIES';

export interface CoreLoopPhaseInfo {
  phase: CoreLoopPhase;
  phaseDisplayName: string;
  phaseHistory: CoreLoopPhase[];
}

// ============================================
// ОТОБРАЖЕНИЕ ФАЗ НА РУССКИЙ
// ============================================

const PHASE_DISPLAY_NAMES: Record<CoreLoopPhase, string> = {
  EXPLORING: 'Исследование',
  IN_DIALOGUE: 'Диалог',
  MAKING_CHOICE: 'Выбор',
  PROCESSING_CONSEQUENCES: 'Последствия',
  PROGRESSING: 'Прогресс',
  NEW_OPPORTUNITIES: 'Новые возможности',
};

// ============================================
// МАППИНГ СОБЫТИЙ НА ФАЗЫ
// ============================================

const EVENT_PHASE_MAP = {
  'scene:enter': 'EXPLORING',
  'scene:exit': 'EXPLORING',
  'dialogue:started': 'IN_DIALOGUE',
  'dialogue:ended': 'EXPLORING',
  'dialogue:choice_made': 'MAKING_CHOICE',
  'choice:made': 'MAKING_CHOICE',
  'consequence:triggered': 'PROCESSING_CONSEQUENCES',
  'stat:changed': 'PROGRESSING',
  'flag:set': 'PROGRESSING',
  'flag:unset': 'PROGRESSING',
  'npc:relation_changed': 'PROGRESSING',
  'quest:activated': 'NEW_OPPORTUNITIES',
  'quest:completed': 'NEW_OPPORTUNITIES',
  'quest:objective_updated': 'PROGRESSING',
  'item:acquired': 'NEW_OPPORTUNITIES',
  'poem:collected': 'NEW_OPPORTUNITIES',
  'achievement:unlocked': 'NEW_OPPORTUNITIES',
  'skill:check': 'MAKING_CHOICE',
} satisfies Partial<Record<keyof EventMap, CoreLoopPhase>>;

// События, после которых фаза кратковременна и должна
// автоматически вернуться к EXPLORING через таймаут
const TRANSIENT_PHASES: CoreLoopPhase[] = [
  'MAKING_CHOICE',
  'PROCESSING_CONSEQUENCES',
  'PROGRESSING',
  'NEW_OPPORTUNITIES',
];

const TRANSIENT_TIMEOUT_MS = 2000;

// ============================================
// ХУК
// ============================================

export function useCoreLoopPhase(): CoreLoopPhaseInfo {
  const [phase, setPhase] = useState<CoreLoopPhase>('EXPLORING');
  const [phaseHistory, setPhaseHistory] = useState<CoreLoopPhase[]>(['EXPLORING']);

  // Отслеживание переходящих фаз — возвращаемся к EXPLORING через таймаут
  const scheduleReturnToExploring = useCallback(() => {
    const timer = setTimeout(() => {
      setPhase(prev => {
        if (TRANSIENT_PHASES.includes(prev)) {
          setPhaseHistory(h => [...h.slice(-19), 'EXPLORING']);
          return 'EXPLORING';
        }
        return prev;
      });
    }, TRANSIENT_TIMEOUT_MS);
    return timer;
  }, []);

  useEffect(() => {
    let transientTimer: ReturnType<typeof setTimeout> | null = null;

    // Подписка на события, которые определяют переход фаз
    const unsubscribers = (
      Object.entries(EVENT_PHASE_MAP) as [keyof EventMap, CoreLoopPhase][]
    ).map(([eventName, mappedPhase]) => {
      return eventBus.on(eventName, () => {
        const newPhase = mappedPhase;

        setPhase(prev => {
          if (prev === newPhase) return prev;

          setPhaseHistory(h => [...h.slice(-19), newPhase]);

          // Для переходящих фаз планируем возврат к EXPLORING
          if (TRANSIENT_PHASES.includes(newPhase)) {
            if (transientTimer) clearTimeout(transientTimer);
            transientTimer = scheduleReturnToExploring();
          }

          return newPhase;
        });
      });
    });

    return () => {
      unsubscribers.forEach(unsub => unsub());
      if (transientTimer) clearTimeout(transientTimer);
    };
  }, [scheduleReturnToExploring]);

  return {
    phase,
    phaseDisplayName: PHASE_DISPLAY_NAMES[phase],
    phaseHistory,
  };
}
