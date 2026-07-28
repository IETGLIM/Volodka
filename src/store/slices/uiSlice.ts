/* ─── Volodka RPG – UI Slice ─── */
/* Game mode, current node, visual overlays, tutorial flags,
 * music state, and journal state. */

import type { StateCreator } from 'zustand';
import type { GameMode } from '@/shared/types/game';
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
import { getInitialLoreEntries } from '@/data/gameDataLoader';
import { eventBus } from '@/engine/EventBus';

/* ─── Slice types ─── */

export type NarrativeKind = 'story' | 'dialogue';

export interface UISliceState {
  /** Always `'exploration'` — use phase flags + getGamePhase() for UI branching. */
  mode: GameMode;
  mainMenuOpen: boolean;
  introActive: boolean;
  combatActive: boolean;
  currentNodeId: string;
  lastSaveTimestamp: number | null;
  lastAutoSaveTimestamp: number | null;
  showStoryOverlay: boolean;
  /** Which narrative renderer to mount while overlay is open. */
  narrativeKind: NarrativeKind | null;
  /** F3 dev tools armed — gates DevPanel + RendererInfoBridge chunks. */
  devToolsArmed: boolean;
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
  setMainMenuOpen: (open: boolean) => void;
  setIntroActive: (active: boolean) => void;
  setCombatActive: (active: boolean) => void;
  setCurrentNodeId: (id: string) => void;
  setShowStoryOverlay: (show: boolean) => void;
  /** Atomically open story/dialogue overlay (avoids node/overlay race). */
  openNarrativeOverlay: (nodeId: string, kind: NarrativeKind) => void;
  /** Atomically close overlay; keep currentNodeId for save/combat resume. */
  closeNarrativeOverlay: () => void;
  setNarrativeKind: (kind: NarrativeKind | null) => void;
  armDevTools: () => void;
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
  mode: 'exploration',
  mainMenuOpen: true,
  introActive: false,
  combatActive: false,
  currentNodeId: 'start',
  lastSaveTimestamp: null,
  lastAutoSaveTimestamp: null,
  showStoryOverlay: false,
  narrativeKind: null,
  devToolsArmed: false,
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

  setMainMenuOpen: (open) =>
    set({
      mode: 'exploration',
      mainMenuOpen: open,
      ...(open ? { introActive: false, combatActive: false } : {}),
    }),

  setIntroActive: (active) =>
    set({
      mode: 'exploration',
      introActive: active,
      ...(active ? { mainMenuOpen: false, combatActive: false } : {}),
    }),

  setCombatActive: (active) =>
    set({
      mode: 'exploration',
      combatActive: active,
      ...(active ? { mainMenuOpen: false, introActive: false } : {}),
    }),

  setCurrentNodeId: (id) => set({ currentNodeId: id?.trim() || 'start' }),

  setShowStoryOverlay: (show) => set({ showStoryOverlay: show }),

  openNarrativeOverlay: (nodeId, kind) =>
    set({ showStoryOverlay: true, currentNodeId: nodeId, narrativeKind: kind }),

  closeNarrativeOverlay: () =>
    set({ showStoryOverlay: false }),

  setNarrativeKind: (kind) => set({ narrativeKind: kind }),

  armDevTools: () => set({ devToolsArmed: true }),

  toggleMatrixRain: () => set((state) => ({ matrixRainEnabled: !state.matrixRainEnabled })),

  setGlitchIntensity: (intensity) => set({ glitchIntensity: clamp(intensity, 0, 1) }),

  toggleNoirMode: () => set((state) => ({ noirMode: !state.noirMode })),

  setMusicVolume: (volume) => {
    const clampedVolume = clamp(volume, 0, 1);
    set({ musicVolume: clampedVolume });
    eventBus.emit('music:set_volume', { volume: clampedVolume });
    try {
      localStorage.setItem('volodka_music_volume', String(Math.round(clampedVolume * 100)));
    } catch {
      /* ignore */
    }
  },

  toggleMusic: () =>
    set((state) => {
      const newEnabled = !state.musicEnabled;
      const { currentSceneId } = readUIFromExploration(get());
      eventBus.emit('music:set_enabled', {
        enabled: newEnabled,
        sceneId: currentSceneId,
      });
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
        const initialEntry = getInitialLoreEntries().find((e) => e.id === entryId);
        if (initialEntry) {
          newLoreEntries.push({ ...initialEntry, discovered: true });
        }
      }

      // Only grant rewards on first discovery
      if (!wasAlreadyDiscovered) {
        // Look up entry data (from store or initial entries) for rarity
        const entryData = existing ?? getInitialLoreEntries().find((e) => e.id === entryId);
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
