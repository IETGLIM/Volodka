// ============================================
// QUEST STORE — Доменный стор: квесты
// ============================================
// Репутация фракций — `factionStore` (persist).
// Отвечает за: активные/завершённые квесты, прогресс, AI-определения.

import { create } from 'zustand';
import { useFactionStore } from './factionStore';
import { QUEST_DEFINITIONS } from '@/data/quests';
import type { ExtendedQuest } from '@/data/types';
import { parseAIQuestPayload } from '@/validation/aiQuestSchema';
import { eventBus } from '@/engine/events/EventBus';
import { applyQuestCompletionRewards } from '@/lib/questRewards';

// ============================================
// TYPES
// ============================================

interface QuestStoreState {
  activeQuestIds: string[];
  completedQuestIds: string[];
  questProgress: Record<string, Record<string, number>>;
  // factionReputations moved to dedicated factionStore with persist
  // Use useFactionStore().factionReputations or getFactionReputation()
  /** Квесты, пришедшие от LLM после Zod-валидации (не в data/quests.ts). */
  aiQuestDefinitions: Record<string, ExtendedQuest>;
}

interface QuestStoreActions {
  activateQuest: (questId: string) => void;
  completeQuest: (questId: string, applyReward?: (reward: QuestRewardData) => void) => void;
  updateQuestObjective: (questId: string, objectiveId: string, value?: number) => void;
  incrementQuestObjective: (questId: string, objectiveId: string) => void;
  isQuestActive: (questId: string) => boolean;
  isQuestCompleted: (questId: string) => boolean;
  getQuestProgress: (questId: string) => Record<string, number>;
  // faction methods delegated to useFactionStore (with persist)
  // updateFactionReputation, getFactionReputation, completeQuestForFaction now in factionStore
  resetQuests: () => void;
  /**
   * Принимает сырой JSON от модели: Zod → при успехе регистрирует определение и активирует квест.
   */
  generateQuestFromAI: (
    payload: unknown
  ) => { success: true; questId: string } | { success: false; error: string };
}

/** Reward data passed to external handler (decoupled from player store) */
interface QuestRewardData {
  creativity?: number;
  mood?: number;
  stability?: number;
  karma?: number;
  skillPoints?: number;
  itemRewards?: string[];
  unlockFlags?: string[];
  perception?: number;
  introspection?: number;
  writing?: number;
  empathy?: number;
  persuasion?: number;
  intuition?: number;
  resilience?: number;
}

type QuestStore = QuestStoreState & QuestStoreActions;

// ============================================
// STORE
// ============================================

export const useQuestStore = create<QuestStore>()((set, get) => ({
  activeQuestIds: ['main_goal', 'first_words'],
  completedQuestIds: [],
  questProgress: {},
  aiQuestDefinitions: {},

  activateQuest: (questId) => {
    const { activeQuestIds, completedQuestIds } = get();
    if (!activeQuestIds.includes(questId) && !completedQuestIds.includes(questId)) {
      set({ activeQuestIds: [...activeQuestIds, questId] });
      eventBus.emit('quest:activated', { questId });
    }
  },

  completeQuest: (questId, applyReward) => {
    const { activeQuestIds, completedQuestIds, questProgress } = get();
    if (!activeQuestIds.includes(questId)) return;

    const newQuestProgress = { ...questProgress };
    delete newQuestProgress[questId];

    // Get reward data from quest definition
    const questDef = QUEST_DEFINITIONS[questId] ?? get().aiQuestDefinitions[questId];
    const reward = questDef?.reward;

    if (applyReward) {
      if (reward) applyReward(reward as unknown as QuestRewardData);
    } else {
      applyQuestCompletionRewards(questId, reward);
    }

    const aiQuestDefinitions = { ...get().aiQuestDefinitions };
    if (aiQuestDefinitions[questId]) {
      delete aiQuestDefinitions[questId];
    }

    set({
      activeQuestIds: activeQuestIds.filter((id) => id !== questId),
      completedQuestIds: [...completedQuestIds, questId],
      questProgress: newQuestProgress,
      aiQuestDefinitions,
    });
    eventBus.emit('quest:completed', { questId });
  },

  updateQuestObjective: (questId, objectiveId, value) => {
    const { questProgress } = get();
    const questObj = questProgress[questId] || {};
    const next = value !== undefined ? value : (questObj[objectiveId] || 0) + 1;
    set({
      questProgress: {
        ...questProgress,
        [questId]: { ...questObj, [objectiveId]: next },
      },
    });
    eventBus.emit('quest:objective_updated', { questId, objectiveId, value: next });
  },

  incrementQuestObjective: (questId, objectiveId) => {
    const { questProgress } = get();
    const questObj = questProgress[questId] || {};
    const currentValue = questObj[objectiveId] || 0;
    const next = currentValue + 1;
    set({
      questProgress: {
        ...questProgress,
        [questId]: { ...questObj, [objectiveId]: next },
      },
    });
    eventBus.emit('quest:objective_updated', { questId, objectiveId, value: next });
  },

  isQuestActive: (questId) => get().activeQuestIds.includes(questId),
  isQuestCompleted: (questId) => get().completedQuestIds.includes(questId),
  getQuestProgress: (questId) => get().questProgress[questId] || {},

  // Delegated to useFactionStore (with persist middleware)
  // Call useFactionStore.getState().updateFactionReputation(factionId, change) or use the hook
  // This avoids duplication and ensures persistence

  resetQuests: () => {
    useFactionStore.getState().resetFactions();
    set({
      activeQuestIds: ['main_goal', 'first_words'],
      completedQuestIds: [],
      questProgress: {},
      aiQuestDefinitions: {},
    });
  },

  generateQuestFromAI: (payload) => {
    const parsed = parseAIQuestPayload(payload);
    if (!parsed.success) {
      return { success: false, error: parsed.error };
    }
    const { quest } = parsed;
    const { aiQuestDefinitions } = get();
    if (aiQuestDefinitions[quest.id]) {
      return { success: false, error: `AI quest already registered: ${quest.id}` };
    }
    set({ aiQuestDefinitions: { ...aiQuestDefinitions, [quest.id]: quest } });
    get().activateQuest(quest.id);
    return { success: true, questId: quest.id };
  },
}));
