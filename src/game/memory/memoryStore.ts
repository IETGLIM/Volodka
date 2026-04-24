'use client';

import { create } from 'zustand';

import { recalculateRelationship } from './RelationshipEngine';
import type { Memory } from './types';

export type MemoryRootState = {
  memories: Memory[];
  /** Раппорт 0..100 по сущности (NPC, сцена…), обновляется при `addMemory` с `relatedEntityId`. */
  relationships: Record<string, number>;
  addMemory: (memory: Memory) => void;
  getMemoriesByTag: (tag: string) => Memory[];
  getMemoriesByEntity: (entityId: string) => Memory[];
};

function normalizeMemory(memory: Memory): Memory {
  return {
    ...memory,
    timestamp: memory.timestamp > 0 ? memory.timestamp : Date.now(),
  };
}

export const useMemoryStore = create<MemoryRootState>((set, get) => ({
  memories: [],
  relationships: {},

  addMemory: (memory) => {
    set((state) => {
      const next = normalizeMemory(memory);
      const without = state.memories.filter((m) => m.id !== next.id);
      const nextMemories = [next, ...without];
      const relationships = { ...state.relationships };
      if (next.relatedEntityId) {
        relationships[next.relatedEntityId] = recalculateRelationship(
          next.relatedEntityId,
          nextMemories,
        );
      }
      return { memories: nextMemories, relationships };
    });
  },

  getMemoriesByTag: (tag) => {
    return get().memories.filter((m) => m.tags?.includes(tag) ?? false);
  },

  getMemoriesByEntity: (entityId) => {
    return get().memories.filter((m) => m.relatedEntityId === entityId);
  },
}));
