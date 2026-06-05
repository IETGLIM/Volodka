/* ─── Volodka RPG – world slice selectors ─── */

import type { NPCRelation, QuestState } from '@/shared/types/game';
import { getGameStore } from '../gameStore';
import { useGameSelector } from './hooks';

/* ─── Plain getters ─── */

export const selectQuests = (s = getGameStore()): QuestState[] => s.quests;

export const selectNpcRelations = (s = getGameStore()): NPCRelation[] => s.npcRelations;

export const selectCollectedPoems = (s = getGameStore()) => s.collectedPoems;

export const selectNpcAffinity = (s = getGameStore()) => s.npcAffinity;

/* ─── React hooks ─── */

export function useQuests(): QuestState[] {
  return useGameSelector((s) => s.quests);
}

export function useNpcRelations(): NPCRelation[] {
  return useGameSelector((s) => s.npcRelations);
}

export function useCollectedPoems() {
  return useGameSelector((s) => s.collectedPoems);
}

export function useNpcAffinity() {
  return useGameSelector((s) => s.npcAffinity);
}
