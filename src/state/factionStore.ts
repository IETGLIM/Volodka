import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FactionId, FactionReputation } from '@/shared/types/factions';
import { FACTIONS, createInitialReputation, updateReputationValue, getStandingLevel, isQuestAvailableByReputation, getInteractionBonus } from '@/shared/types/factions';
import { QUEST_DEFINITIONS } from '@/data/quests';
import type { ExtendedQuest } from '@/data/types';

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

interface FactionStoreState {
  factionReputations: Record<FactionId, FactionReputation>;
}

interface FactionStoreActions {
  updateFactionReputation: (factionId: FactionId, change: number) => void;
  getFactionReputation: (factionId: FactionId) => number;
  getFactionStanding: (factionId: FactionId) => string;
  isQuestAvailableForFaction: (questId: string, factionId: FactionId) => { available: boolean; reason?: string };
  getInteractionBonusForFaction: (factionId: FactionId) => { dialogueBonus: number; discountBonus: number; questBonus: number };
  resetFactions: () => void;
  /** For use in questMetaStore or DialogueEngine */
  completeQuestForFaction: (questId: string, factionId: FactionId) => void;
}

type FactionStore = FactionStoreState & FactionStoreActions;

// ============================================
// STORE (with persist middleware)
// ============================================

export const useFactionStore = create<FactionStore>()(
  persist(
    (set, get) => ({
      factionReputations: INITIAL_FACTION_REPUTATIONS,

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

      getFactionStanding: (factionId) => {
        const rep = get().factionReputations[factionId];
        return rep ? rep.standing : 'neutral';
      },

      isQuestAvailableForFaction: (questId, factionId) => {
        const rep = get().factionReputations[factionId];
        if (!rep) return { available: false, reason: 'No reputation data' };
        const reputations = { [factionId]: rep.value };
        return isQuestAvailableByReputation(questId, reputations as any);
      },

      getInteractionBonusForFaction: (factionId) => {
        const rep = get().factionReputations[factionId];
        if (!rep) return { dialogueBonus: 0, discountBonus: 0, questBonus: 0 };
        const faction = FACTIONS[factionId];
        if (!faction) return { dialogueBonus: 0, discountBonus: 0, questBonus: 0 };
        return getInteractionBonus(factionId, rep.value);
      },

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

      resetFactions: () =>
        set({
          factionReputations: INITIAL_FACTION_REPUTATIONS,
        }),
    }),
    {
      name: 'faction-storage',
      partialize: (state) => ({ factionReputations: state.factionReputations }),
    }
  )
);

// Re-export for convenience
export type { FactionId, FactionReputation } from '@/shared/types/factions';
export { FACTIONS } from '@/shared/types/factions';
