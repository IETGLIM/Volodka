// ============================================
// QUEST STORE — Доменный стор: квесты и фракции
// ============================================
// Отвечает за: квесты (активные/завершённые/прогресс),
// фракции (репутация, взаимодействия).

import { create } from 'zustand';
import type { FactionId, FactionReputation } from '@/shared/types/factions';
import { FACTIONS, createInitialReputation, updateReputationValue, getStandingLevel } from '@/shared/types/factions';
import { QUEST_DEFINITIONS } from '@/data/quests';
import type { ExtendedQuest } from '@/data/types';
import { parseAIQuestPayload } from '@/validation/aiQuestSchema';

// ============================================
// INITIAL STATE
// ============================================

const INITIAL_FACTION_REPUTATIONS: Record<FactionId, FactionReputation> = {
  poets: createInitialReputation('poets'),
  it_workers: createInitialReputation('it_workers'),
  dreamers: createInitialReputation('dreamers'),
  locals: createInitialReputation('locals'),
  shadow_network: createInitialReputation('shadow_network'),
};

// ============================================
// TYPES
// ============================================

interface QuestStoreState {
  activeQuestIds: string[];
  completedQuestIds: string[];
  questProgress: Record<string, Record<string, number>>;
  factionReputations: Record<FactionId, FactionReputation>;
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
  updateFactionReputation: (factionId: FactionId, change: number) => void;
  getFactionReputation: (factionId: FactionId) => number;
  completeQuestForFaction: (questId: string, factionId: FactionId) => void;
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
  factionReputations: INITIAL_FACTION_REPUTATIONS,
  aiQuestDefinitions: {},

  activateQuest: (questId) => {
    const { activeQuestIds, completedQuestIds } = get();
    if (!activeQuestIds.includes(questId) && !completedQuestIds.includes(questId)) {
      set({ activeQuestIds: [...activeQuestIds, questId] });
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

    if (reward && applyReward) {
      applyReward(reward as unknown as QuestRewardData);
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
  },

  updateQuestObjective: (questId, objectiveId, value) => {
    const { questProgress } = get();
    const questObj = questProgress[questId] || {};
    set({
      questProgress: {
        ...questProgress,
        [questId]: { ...questObj, [objectiveId]: value !== undefined ? value : (questObj[objectiveId] || 0) + 1 },
      },
    });
  },

  incrementQuestObjective: (questId, objectiveId) => {
    const { questProgress } = get();
    const questObj = questProgress[questId] || {};
    const currentValue = questObj[objectiveId] || 0;
    set({
      questProgress: {
        ...questProgress,
        [questId]: { ...questObj, [objectiveId]: currentValue + 1 },
      },
    });
  },

  isQuestActive: (questId) => get().activeQuestIds.includes(questId),
  isQuestCompleted: (questId) => get().completedQuestIds.includes(questId),
  getQuestProgress: (questId) => get().questProgress[questId] || {},

  updateFactionReputation: (factionId, change) => {
    const { factionReputations } = get();
    const current = factionReputations[factionId];
    const faction = FACTIONS[factionId];
    if (!current || !faction) return;

    const otherReps = Object.fromEntries(
      Object.entries(factionReputations).map(([id, rep]) => [id, rep.value])
    ) as Record<FactionId, number>;

    const newValue = updateReputationValue(current.value, change, faction, otherReps);
    set({
      factionReputations: {
        ...factionReputations,
        [factionId]: {
          ...current,
          value: newValue,
          standing: getStandingLevel(newValue),
          interactions: current.interactions + 1,
          lastInteraction: Date.now(),
        },
      },
    });
  },

  getFactionReputation: (factionId) => get().factionReputations[factionId]?.value || 0,

  completeQuestForFaction: (questId, factionId) => {
    const { factionReputations } = get();
    const current = factionReputations[factionId];
    if (!current) return;
    set({
      factionReputations: {
        ...factionReputations,
        [factionId]: { ...current, questsCompleted: [...current.questsCompleted, questId] },
      },
    });
  },

  resetQuests: () =>
    set({
      activeQuestIds: ['main_goal', 'first_words'],
      completedQuestIds: [],
      questProgress: {},
      factionReputations: INITIAL_FACTION_REPUTATIONS,
      aiQuestDefinitions: {},
    }),

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
