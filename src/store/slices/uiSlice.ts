/* ─── Volodka RPG – UI Slice ─── */
/* Game mode, current node, visual overlays, tutorial flags,
 * music state, and journal state. */

import type { StateCreator } from 'zustand';
import type { GameMode } from '@/shared/types/game';
import { BOOT_PHASE_FLAGS } from '@/shared/gamePhase';
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
import { getPlayerStore } from '../storeBindings';
import { readUIFromExploration } from '../crossSliceReads';
import { getInitialLoreEntries } from '@/data/gameDataLoader';
import {
  emitLoreDiscovered,
  scheduleMusicEnabledChanged,
  scheduleMusicVolumeChanged,
} from '../storeEffects';

/* ─── Slice types ─── */

import type { NarrativeKind } from '@/shared/types/narrativeKind';
export type { NarrativeKind } from '@/shared/types/narrativeKind';

export interface DiegeticNarrativeState {
  nodeId: string;
  kind: NarrativeKind;
}

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
  /** Compact bottom HUD for Act 1 — no world dim, movement stays unlocked. */
  diegeticNarrative: DiegeticNarrativeState | null;
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
  openDiegeticNarrative: (nodeId: string, kind: NarrativeKind) => void;
  closeDiegeticNarrative: () => void;
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
  // Boot order: poem intro (Matrix rain) first → then main menu → cutscene.
  ...BOOT_PHASE_FLAGS,
  currentNodeId: 'start',
  lastSaveTimestamp: null,
  lastAutoSaveTimestamp: null,
  showStoryOverlay: false,
  diegeticNarrative: null,
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
    set({
      showStoryOverlay: true,
      diegeticNarrative: null,
      currentNodeId: nodeId,
      narrativeKind: kind,
    }),

  closeNarrativeOverlay: () =>
    set({ showStoryOverlay: false, diegeticNarrative: null }),

  openDiegeticNarrative: (nodeId, kind) =>
    set({
      showStoryOverlay: false,
      diegeticNarrative: { nodeId, kind },
      currentNodeId: nodeId,
      narrativeKind: kind,
    }),

  closeDiegeticNarrative: () =>
    set({ diegeticNarrative: null }),

  setNarrativeKind: (kind) => set({ narrativeKind: kind }),

  armDevTools: () => set({ devToolsArmed: true }),

  toggleMatrixRain: () => set((state) => ({ matrixRainEnabled: !state.matrixRainEnabled })),

  setGlitchIntensity: (intensity) => set({ glitchIntensity: clamp(intensity, 0, 1) }),

  toggleNoirMode: () => set((state) => ({ noirMode: !state.noirMode })),

  setMusicVolume: (volume) => {
    const clampedVolume = clamp(volume, 0, 1);
    set({ musicVolume: clampedVolume });
    scheduleMusicVolumeChanged(clampedVolume);
  },

  toggleMusic: () => {
    const newEnabled = !get().musicEnabled;
    set({ musicEnabled: newEnabled });
    const { currentSceneId } = readUIFromExploration();
    scheduleMusicEnabledChanged(newEnabled, currentSceneId);
  },

  toggleJournal: () => set((state) => ({ journalOpen: !state.journalOpen })),

  setJournalTab: (tab) => set({ journalTab: tab }),

  setJournalOpen: (open) => set({ journalOpen: open }),

  addLoreEntry: (entry) =>
    set((state) => {
      if (state.loreEntries.find((e) => e.id === entry.id)) return state;
      return { loreEntries: [...state.loreEntries, entry] };
    }),

  discoverLoreEntry: (entryId) => {
    const firstDiscoveryRef: {
      value: { title: string; rarity: LoreRarity; category: LoreEntry['category'] } | null;
    } = { value: null };

    set((state) => {
      const existing = state.loreEntries.find((e) => e.id === entryId);
      const wasAlreadyDiscovered = existing?.discovered ?? false;

      const newLoreEntries = state.loreEntries.map((e) =>
        e.id === entryId ? { ...e, discovered: true } : e,
      );

      if (!existing) {
        const initialEntry = getInitialLoreEntries().find((e) => e.id === entryId);
        if (initialEntry) {
          newLoreEntries.push({ ...initialEntry, discovered: true });
        }
      }

      if (!wasAlreadyDiscovered) {
        const entryData = existing ?? getInitialLoreEntries().find((e) => e.id === entryId);
        firstDiscoveryRef.value = {
          title: entryData?.title ?? entryId,
          rarity: entryData?.rarity ?? 'common',
          category: entryData?.category ?? 'history',
        };
      }

      return { loreEntries: newLoreEntries };
    });

    const firstDiscovery = firstDiscoveryRef.value;
    if (firstDiscovery) {
      const player = getPlayerStore();
      player.addXp(5);
      if (firstDiscovery.rarity === 'rare' || firstDiscovery.rarity === 'legendary') {
        player.addSkill('writing', 1);
      }
      emitLoreDiscovered({
        id: entryId,
        title: firstDiscovery.title,
        rarity: firstDiscovery.rarity,
        category: firstDiscovery.category,
      });
    }
  },

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
