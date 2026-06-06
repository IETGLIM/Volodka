/* ─── Volodka RPG – UI Slice ─── */
/* Game mode, current node, visual overlays, tutorial flags,
 * music state, and journal state. */

import type { StateCreator } from 'zustand';
import type { GameMode, SceneId } from '@/shared/types/game';
import {
  clamp,
  createDefaultTutorialFlags,
  type JournalTab,
  type LoreEntry,
  type LoreRarity,
  type ConversationLogEntry,
  type TutorialFlags,
} from '../shared';
import type { GameStoreState } from '../types';
import { readUIFromExploration } from '../crossSliceReads';
import { INITIAL_LORE_ENTRIES } from '@/data/loreEntries';
import { eventBus } from '@/engine/EventBus';
import { musicEngine } from '@/engine/MusicEngine';

/* ─── Slice types ─── */

export interface UISliceState {
  mode: GameMode;
  currentNodeId: string;
  lastSaveTimestamp: number | null;
  lastAutoSaveTimestamp: number | null;
  showStoryOverlay: boolean;
  matrixRainEnabled: boolean;
  glitchIntensity: number;
  noirMode: boolean;
  tutorialFlags: TutorialFlags;
  musicVolume: number;
  musicEnabled: boolean;
  journalOpen: boolean;
  journalTab: JournalTab;
  loreEntries: LoreEntry[];
  conversationLog: Record<string, ConversationLogEntry[]>;
  introSeen: boolean;
}

export interface UISliceActions {
  setMode: (mode: GameMode) => void;
  setCurrentNodeId: (id: string) => void;
  setShowStoryOverlay: (show: boolean) => void;
  /** Atomically open story/dialogue overlay (avoids node/overlay race). */
  openNarrativeOverlay: (nodeId: string) => void;
  /** Atomically close overlay; keep currentNodeId for save/combat resume. */
  closeNarrativeOverlay: () => void;
  toggleMatrixRain: () => void;
  setGlitchIntensity: (intensity: number) => void;
  toggleNoirMode: () => void;
  setMusicVolume: (volume: number) => void;
  toggleMusic: () => void;
  toggleJournal: () => void;
  setJournalTab: (tab: JournalTab) => void;
  setJournalOpen: (open: boolean) => void;
  addLoreEntry: (entry: LoreEntry) => void;
  discoverLoreEntry: (entryId: string) => void;
  addConversationLog: (npcId: string, entry: ConversationLogEntry) => void;
  setIntroSeen: (seen: boolean) => void;
}

export type UISlice = UISliceState & UISliceActions;

/* ─── Slice creator ─── */

export const createUISlice: StateCreator<
  GameStoreState,
  [],
  [],
  UISlice
> = (set, get) => ({
  /* ── Initial state ── */
  mode: 'menu',
  currentNodeId: 'start',
  lastSaveTimestamp: null,
  lastAutoSaveTimestamp: null,
  showStoryOverlay: false,
  matrixRainEnabled: true,
  glitchIntensity: 0,
  noirMode: false,
  tutorialFlags: createDefaultTutorialFlags(),
  musicVolume: 0.5,
  musicEnabled: true,
  journalOpen: false,
  journalTab: 'notes',
  loreEntries: [],
  conversationLog: {},
  introSeen: false,

  /* ── Actions ── */

  setMode: (mode) => set({ mode }),

  setCurrentNodeId: (id) => set({ currentNodeId: id?.trim() || 'start' }),

  setShowStoryOverlay: (show) => set({ showStoryOverlay: show }),

  openNarrativeOverlay: (nodeId) =>
    set({ showStoryOverlay: true, currentNodeId: nodeId }),

  closeNarrativeOverlay: () =>
    set({ showStoryOverlay: false }),

  toggleMatrixRain: () => set((state) => ({ matrixRainEnabled: !state.matrixRainEnabled })),

  setGlitchIntensity: (intensity) => set({ glitchIntensity: clamp(intensity, 0, 1) }),

  toggleNoirMode: () => set((state) => ({ noirMode: !state.noirMode })),

  setMusicVolume: (volume) => {
    const clampedVolume = clamp(volume, 0, 1);
    set({ musicVolume: clampedVolume });
    musicEngine.setVolume(clampedVolume);
  },

  toggleMusic: () =>
    set((state) => {
      const newEnabled = !state.musicEnabled;
      if (!newEnabled) {
        musicEngine.stopMusic(1);
      } else {
        const { currentSceneId } = readUIFromExploration(get());
        musicEngine.playSceneMusic(currentSceneId);
      }
      return { musicEnabled: newEnabled };
    }),

  toggleJournal: () => set((state) => ({ journalOpen: !state.journalOpen })),

  setJournalTab: (tab) => set({ journalTab: tab }),

  setJournalOpen: (open) => set({ journalOpen: open }),

  addLoreEntry: (entry) =>
    set((state) => {
      if (state.loreEntries.find((e) => e.id === entry.id)) return state;
      return { loreEntries: [...state.loreEntries, entry] };
    }),

  discoverLoreEntry: (entryId) =>
    set((state) => {
      // Check if already discovered in store
      const existing = state.loreEntries.find((e) => e.id === entryId);
      const wasAlreadyDiscovered = existing?.discovered ?? false;

      // Update lore entries
      const newLoreEntries = state.loreEntries.map((e) =>
        e.id === entryId ? { ...e, discovered: true } : e,
      );

      // If entry not in store yet, add it discovered
      if (!existing) {
        const initialEntry = INITIAL_LORE_ENTRIES.find((e) => e.id === entryId);
        if (initialEntry) {
          newLoreEntries.push({ ...initialEntry, discovered: true });
        }
      }

      // Only grant rewards on first discovery
      if (!wasAlreadyDiscovered) {
        // Look up entry data (from store or initial entries) for rarity
        const entryData = existing ?? INITIAL_LORE_ENTRIES.find((e) => e.id === entryId);
        const title = entryData?.title ?? entryId;
        const rarity: LoreRarity = entryData?.rarity ?? 'common';

        // Grant +5 XP for any lore discovery
        const crossState = get();
        crossState.addXp(5);

        // Grant +1 writing skill for rare/legendary entries
        if (rarity === 'rare' || rarity === 'legendary') {
          crossState.addSkill('writing', 1);
        }

        // Emit event for toast notification
        try {
          eventBus.emit('lore:discovered', { id: entryId, title, rarity });
        } catch { /* ignore */ }
      }

      return { loreEntries: newLoreEntries };
    }),

  addConversationLog: (npcId, entry) =>
    set((state) => {
      const existing = state.conversationLog[npcId] ?? [];
      return {
        conversationLog: {
          ...state.conversationLog,
          [npcId]: [...existing, entry].slice(-10),
        },
      };
    }),

  setIntroSeen: (seen) => set({ introSeen: seen }),
});
