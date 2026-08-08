/* ─── Volodka RPG – Standalone NPC Codex Store ─── */
/* NOT part of GameStoreState. Persisted via localStorage. */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { persist } from 'zustand/middleware';
import {
  NpcCodexSliceInitialState,
  type NpcCodexSlice,
} from '../slices/npcCodexSlice';

export const useNpcCodexStore = create<NpcCodexSlice>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        ...NpcCodexSliceInitialState,

        discoverNpc: (npcId: string) => {
          const current = get();
          if (current.discoveredNpcs.includes(npcId)) return;
          set({
            discoveredNpcs: [...current.discoveredNpcs, npcId],
          });
        },

        unlockNpcLore: (npcId: string, loreKey: string) => {
          const current = get();
          const existing = current.unlockedNpcLore[npcId];
          if (existing?.includes(loreKey)) return;
          set({
            unlockedNpcLore: {
              ...current.unlockedNpcLore,
              [npcId]: [...(existing ?? []), loreKey],
            },
          });
        },

        isNpcDiscovered: (npcId: string) => {
          return get().discoveredNpcs.includes(npcId);
        },

        getNpcLore: (npcId: string) => {
          return get().unlockedNpcLore[npcId] ?? [];
        },
      }),
      {
        name: 'volodka-npc-codex',
        partialize: (state) => ({
          discoveredNpcs: state.discoveredNpcs,
          unlockedNpcLore: state.unlockedNpcLore,
        }),
        version: 1,
      },
    ),
  ),
);

export function getNpcCodexStoreState(): NpcCodexSlice {
  return useNpcCodexStore.getState();
}
