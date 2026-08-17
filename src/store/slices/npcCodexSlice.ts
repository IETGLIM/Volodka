/* ─── Volodka RPG – NPC Codex Slice ─── */
/* Tracks NPC discovery state and unlocked lore entries.
 * This is a STANDALONE store (not part of GameStoreState).
 * Persisted via localStorage through Zustand persist middleware.
 */

/* ─── Types ─── */

export interface NpcCodexSliceState {
  /** NPC IDs the player has met/interacted with */
  discoveredNpcs: string[];
  /** Per-NPC unlocked lore keys: npcId → lore key array */
  unlockedNpcLore: Record<string, string[]>;
}

export interface NpcCodexSliceActions {
  /** Mark an NPC as discovered (idempotent). */
  discoverNpc: (npcId: string) => void;
  /** Unlock a lore key for a specific NPC (idempotent). */
  unlockNpcLore: (npcId: string, loreKey: string) => void;
  /** Check if an NPC has been discovered. */
  isNpcDiscovered: (npcId: string) => boolean;
  /** Get all unlocked lore keys for an NPC. */
  getNpcLore: (npcId: string) => readonly string[];
}

export type NpcCodexSlice = NpcCodexSliceState & NpcCodexSliceActions;

/* ─── Slice creator ─── */

export const NpcCodexSliceInitialState: NpcCodexSliceState = {
  discoveredNpcs: [],
  unlockedNpcLore: {},
};

export const createNpcCodexSlice = (
  set: (partial: Partial<NpcCodexSlice> | ((s: NpcCodexSlice) => Partial<NpcCodexSlice>)) => void,
  get: () => NpcCodexSlice,
): NpcCodexSlice => ({
  ...NpcCodexSliceInitialState,

  discoverNpc: (npcId) => {
    const current = get();
    if (current.discoveredNpcs.includes(npcId)) return;
    set({
      discoveredNpcs: [...current.discoveredNpcs, npcId],
    });
  },

  unlockNpcLore: (npcId, loreKey) => {
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

  isNpcDiscovered: (npcId) => {
    return get().discoveredNpcs.includes(npcId);
  },

  getNpcLore: (npcId) => {
    return get().unlockedNpcLore[npcId] ?? [];
  },
});
