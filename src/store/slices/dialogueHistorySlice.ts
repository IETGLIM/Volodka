/* ─── Volodka RPG – Dialogue History Slice ─── */
/* Persistent dialogue log — FIFO capped at 100 entries.
 * Tracks NPC lines and player choices for the DialogueHistoryPanel overlay. */

import type { StateCreator } from 'zustand';
import type { GameStoreState } from '../types';

/* ─── Types ─── */

export interface DialogueHistoryEntry {
  id: string;
  speaker: string;
  text: string;
  timestamp: number;
  sceneId: string;
  isPlayerChoice?: boolean;
}

export interface DialogueHistorySliceState {
  dialogueHistory: DialogueHistoryEntry[];
}

export interface DialogueHistorySliceActions {
  addDialogueEntry: (entry: Omit<DialogueHistoryEntry, 'id'>) => void;
  clearDialogueHistory: () => void;
}

export type DialogueHistorySlice = DialogueHistorySliceState & DialogueHistorySliceActions;

/* ─── Constants ─── */

const MAX_DIALOGUE_HISTORY = 100;

/* ─── Helpers ─── */

let idCounter = 0;
function nextId(): string {
  return `dh_${Date.now()}_${++idCounter}`;
}

/* ─── Slice creator ─── */

export const createDialogueHistorySlice: StateCreator<
  GameStoreState,
  [],
  [],
  DialogueHistorySlice
> = (set) => ({
  /* ── Initial state ── */
  dialogueHistory: [],

  /* ── Actions ── */

  addDialogueEntry: (entry) =>
    set((state) => {
      const enriched: DialogueHistoryEntry = { ...entry, id: nextId() };
      const next = [...state.dialogueHistory, enriched];
      // FIFO: keep only the last MAX entries
      if (next.length > MAX_DIALOGUE_HISTORY) {
        return { dialogueHistory: next.slice(next.length - MAX_DIALOGUE_HISTORY) };
      }
      return { dialogueHistory: next };
    }),

  clearDialogueHistory: () =>
    set({ dialogueHistory: [] }),
});
