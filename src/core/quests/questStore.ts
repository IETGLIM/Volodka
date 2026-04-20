'use client';

import { create } from 'zustand';

import type { Quest, QuestObjective } from './types';

export type QuestRootState = {
  quests: Record<string, Quest>;
  startQuest: (quest: Quest) => void;
  completeObjective: (questId: string, objectiveId: string) => void;
  completeQuest: (questId: string) => void;
  /** Partial progress for `interact` objectives (used by `QuestEngine`). */
  incrementObjectiveCount: (questId: string, objectiveId: string) => void;
};

function cloneObjectivesForStart(objectives: QuestObjective[]): QuestObjective[] {
  return objectives.map((o) => ({
    ...o,
    completed: false,
    currentCount: 0,
  }));
}

function allObjectivesDone(objectives: QuestObjective[]): boolean {
  return objectives.length > 0 && objectives.every((o) => o.completed);
}

export const useQuestStore = create<QuestRootState>((set) => ({
  quests: {},

  startQuest: (quest) => {
    set((state) => {
      const existing = state.quests[quest.id];
      if (existing?.status === 'active' || existing?.status === 'completed') {
        return state;
      }
      const next: Quest = {
        ...quest,
        status: 'active',
        objectives: cloneObjectivesForStart(quest.objectives),
      };
      return {
        quests: { ...state.quests, [quest.id]: next },
      };
    });
  },

  incrementObjectiveCount: (questId, objectiveId) => {
    set((state) => {
      const q = state.quests[questId];
      if (!q || q.status !== 'active') return state;
      const objectives = q.objectives.map((o) =>
        o.id === objectiveId
          ? { ...o, currentCount: (o.currentCount ?? 0) + 1 }
          : o,
      );
      return {
        quests: {
          ...state.quests,
          [questId]: { ...q, objectives },
        },
      };
    });
  },

  completeObjective: (questId, objectiveId) => {
    set((state) => {
      const q = state.quests[questId];
      if (!q || q.status !== 'active') return state;
      const objectives = q.objectives.map((o) =>
        o.id === objectiveId
          ? {
              ...o,
              completed: true,
              currentCount: o.requiredCount ?? o.currentCount ?? 1,
            }
          : o,
      );
      const status = allObjectivesDone(objectives) ? 'completed' : 'active';
      return {
        quests: {
          ...state.quests,
          [questId]: { ...q, objectives, status },
        },
      };
    });
  },

  completeQuest: (questId) => {
    set((state) => {
      const q = state.quests[questId];
      if (!q || q.status === 'completed') return state;
      return {
        quests: {
          ...state.quests,
          [questId]: { ...q, status: 'completed' },
        },
      };
    });
  },
}));
