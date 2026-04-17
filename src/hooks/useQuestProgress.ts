// ============================================
// useQuestProgress — Автоматическое обновление квестов
// ============================================

import { useCallback, useEffect, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from '../store/gameStore';
import { QUEST_DEFINITIONS, isObjectiveSatisfied } from '../data/quests';
import { getFactionByNPC, FACTIONS, type FactionId } from '../data/factions';
import type { SceneId } from '../data/types';

// ============================================
// ТИПЫ СОБЫТИЙ ДЛЯ ОБНОВЛЕНИЯ КВЕСТОВ
// ============================================

export type QuestEventType = 
  | 'poem_collected'      // Собрано стихотворение
  | 'poem_written'        // Написано стихотворение
  | 'npc_talked'          // Разговор с NPC
  | 'location_visited'    // Посещена локация
  | 'item_collected'      // Собран предмет
  | 'terminal_used'       // Использован терминал
  | 'choice_made'         // Сделан выбор
  | 'quest_completed';    // Квест завершён

export interface QuestEvent {
  type: QuestEventType;
  data: {
    poemId?: string;
    npcId?: string;
    locationId?: SceneId;
    itemId?: string;
    choiceId?: string;
    questId?: string;
    [key: string]: unknown;
  };
}

// ============================================
// МАППИНГ СОБЫТИЙ К OBJECTIVES
// ============================================

// Карта: тип события -> (questId, objectiveId)
/** Экспорт для тестов целостности: условия должны ссылаться на реальные `npcId` в данных. */
export const EVENT_OBJECTIVE_MAP: Partial<Record<QuestEventType, Array<{ questId: string; objectiveId: string; condition?: (data: Record<string, unknown>) => boolean }>>> = {
  poem_collected: [
    { questId: 'main_goal', objectiveId: 'write_poems' },
    { questId: 'poetry_collection', objectiveId: 'write_poems' },
  ],
  poem_written: [
    { questId: 'first_words', objectiveId: 'write_poem' },
    { questId: 'night_owl', objectiveId: 'write_nights' },
  ],
  npc_talked: [
    { questId: 'maria_connection', objectiveId: 'talk_maria', condition: (d) => d.npcId === 'cafe_college_girl' },
    { questId: 'maria_connection', objectiveId: 'exchange_contacts', condition: (d) => d.npcId === 'cafe_college_girl' },
    { questId: 'lost_memories', objectiveId: 'meet_stranger', condition: (d) => d.npcId === 'dream_quester' },
    { questId: 'lost_memories', objectiveId: 'speak_to_lillian', condition: (d) => d.npcId === 'dream_lillian' },
    { questId: 'star_connection', objectiveId: 'meet_astra', condition: (d) => d.npcId === 'dream_galaxy' },
  ],
  location_visited: [
    { questId: 'first_reading', objectiveId: 'go_to_cafe', condition: (d) => d.locationId === 'cafe_evening' },
    { questId: 'coffee_affair', objectiveId: 'visit_cafe', condition: (d) => d.locationId === 'cafe_evening' },
    { questId: 'lost_memories', objectiveId: 'reach_lake', condition: (d) => d.locationId === 'dream' },
  ],
  // IT-цели терминала обновляются через effect.questObjective в ITTerminal.tsx — дублировать здесь нельзя
};

// ============================================
// HOOK
// ============================================

export function useQuestProgress() {
  const activeQuestIds = useGameStore((s) => s.activeQuestIds);
  const completedQuestIds = useGameStore((s) => s.completedQuestIds);
  const questProgress = useGameStore((s) => s.questProgress);
  const incrementQuestObjective = useGameStore((s) => s.incrementQuestObjective);
  const updateQuestObjective = useGameStore((s) => s.updateQuestObjective);
  const completeQuest = useGameStore((s) => s.completeQuest);
  const activateQuest = useGameStore((s) => s.activateQuest);
  const updateFactionReputation = useGameStore((s) => s.updateFactionReputation);

  // Активные квесты с прогрессом
  const activeQuestsWithProgress = useMemo(() => {
    return activeQuestIds
      .map((id) => {
        const def = QUEST_DEFINITIONS[id];
        if (!def) return null;
        
        const progress = questProgress[id] || {};
        
        // Обновляем objectives с текущим прогрессом
        const objectives = def.objectives.map((obj) => {
          const cur = progress[obj.id] ?? obj.currentValue ?? 0;
          return {
            ...obj,
            currentValue: cur,
            completed: isObjectiveSatisfied(obj, cur),
          };
        });
        
        const allCompleted = objectives.every((o) => o.completed);
        
        return {
          ...def,
          objectives,
          progressPercent: objectives.filter((o) => o.completed).length / objectives.length * 100,
          isCompletable: allCompleted && !completedQuestIds.includes(id),
        };
      })
      .filter(Boolean);
  }, [activeQuestIds, questProgress, completedQuestIds]);

  // Обработать событие
  const handleEvent = useCallback((event: QuestEvent) => {
    const mappings = EVENT_OBJECTIVE_MAP[event.type];
    if (!mappings) return;

    mappings.forEach(({ questId, objectiveId, condition }) => {
      // Проверяем что квест активен
      if (!activeQuestIds.includes(questId)) return;
      
      // Проверяем условие
      if (condition && !condition(event.data)) return;

      // Инкрементируем objective
      incrementQuestObjective(questId, objectiveId);
    });
  }, [activeQuestIds, incrementQuestObjective]);

  // Проверить завершение квестов
  // NOTE: gameStore.completeQuest() already applies rewards (stats, skills, items, flags)
  // So we only need to call completeQuest() here — no duplicate reward logic
  const checkQuestCompletion = useCallback(() => {
    activeQuestsWithProgress.forEach((quest) => {
      if (quest?.isCompletable) {
        completeQuest(quest.id);
        
        // Обновляем репутацию фракции
        for (const [factionId, faction] of Object.entries(FACTIONS)) {
          if (faction.quests.includes(quest.id)) {
            updateFactionReputation(factionId as FactionId, 10);
            break;
          }
        }
      }
    });
  }, [activeQuestsWithProgress, completeQuest, updateFactionReputation]);

  // Автоматическая проверка завершения при изменении прогресса
  useEffect(() => {
    checkQuestCompletion();
  }, [questProgress, checkQuestCompletion]);

  // Разговор с NPC — обновляем репутацию фракции
  const handleNPCInteraction = useCallback((npcId: string, relationChange: number = 1) => {
    const factionId = getFactionByNPC(npcId);
    if (factionId) {
      updateFactionReputation(factionId, relationChange);
    }
    
    // Генерируем событие для квестов
    handleEvent({
      type: 'npc_talked',
      data: { npcId },
    });
  }, [updateFactionReputation, handleEvent]);

  // Посещение локации
  const handleLocationVisit = useCallback((locationId: SceneId) => {
    handleEvent({
      type: 'location_visited',
      data: { locationId },
    });
  }, [handleEvent]);

  // Сбор стихотворения
  const handlePoemCollected = useCallback((poemId: string) => {
    handleEvent({
      type: 'poem_collected',
      data: { poemId },
    });
  }, [handleEvent]);

  // Использование терминала
  const handleTerminalUsed = useCallback((command?: string) => {
    handleEvent({
      type: 'terminal_used',
      data: { command },
    });
  }, [handleEvent]);

  // Активировать квест
  const activateQuestById = useCallback((questId: string) => {
    if (!activeQuestIds.includes(questId) && !completedQuestIds.includes(questId)) {
      activateQuest(questId);
    }
  }, [activeQuestIds, completedQuestIds, activateQuest]);

  return {
    activeQuests: activeQuestsWithProgress,
    completedQuestIds,
    handleEvent,
    handleNPCInteraction,
    handleLocationVisit,
    handlePoemCollected,
    handleTerminalUsed,
    activateQuest: activateQuestById,
    checkQuestCompletion,
  };
}

// ============================================
// SELECTOR HOOKS
// ============================================

export const useQuests = () => useGameStore(useShallow((s) => ({
  activeQuestIds: s.activeQuestIds,
  completedQuestIds: s.completedQuestIds,
  questProgress: s.questProgress,
  activateQuest: s.activateQuest,
  completeQuest: s.completeQuest,
  updateQuestObjective: s.updateQuestObjective,
  incrementQuestObjective: s.incrementQuestObjective,
})));

export const useFactions = () => useGameStore(useShallow((s) => ({
  factionReputations: s.factionReputations,
  updateFactionReputation: s.updateFactionReputation,
  getFactionReputation: s.getFactionReputation,
})));

export default useQuestProgress;

/**
 * Подписка на мир: посещение локации для квестов + базовый прогресс.
 * Вызывать из корня игры (GameOrchestrator) с текущей сценой из узла сюжета.
 */
export function useQuestProgressBridge(currentSceneId: SceneId) {
  const api = useQuestProgress();

  useEffect(() => {
    api.handleLocationVisit(currentSceneId);
  }, [currentSceneId, api.handleLocationVisit]);

  return api;
}
