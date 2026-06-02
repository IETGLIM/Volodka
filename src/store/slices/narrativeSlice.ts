/* ─── Volodka RPG – Narrative Slice ───
 * Unified state management for all narrative content:
 * dialogues, story nodes, examine panels, environmental interactions.
 * Creates a continuous "story feed" instead of scattered popups.
 */

import type { StateCreator } from 'zustand';

/* ─── Narrative Entry Types ─── */

export type NarrativeEntryType =
  | 'dialogue'      // NPC dialogue line
  | 'story'         // Story narration
  | 'examine'       // Object examination
  | 'environment'   // Environmental description
  | 'player_choice' // Player's selected choice
  | 'system';       // System message (skill checks, etc.)

export interface NarrativeEntry {
  id: string;
  type: NarrativeEntryType;
  timestamp: number;
  speaker?: string;
  speakerId?: string;
  text: string;
  /** For examine entries: additional detail text */
  detailText?: string;
  /** Icon for examine entries */
  icon?: string;
  /** Effects that were applied */
  effects?: Array<{ type: string; value?: number; skill?: string; stat?: string }>;
  /** Whether this entry is "active" (current interaction) */
  isActive?: boolean;
  /** Related scene or location */
  sceneId?: string;
  /** Emotional tone */
  emotion?: 'calm' | 'angry' | 'sad' | 'happy' | 'mysterious';
}

export interface NarrativeChoice {
  id: string;
  text: string;
  effects?: Array<{ type: string; value?: number; skill?: string }>;
  condition?: {
    minKarma?: number;
    maxKarma?: number;
    flag?: string;
    minSkill?: Record<string, number>;
    requiredAct?: number;
    minNpcRelation?: number;
    npcId?: string;
  };
  nextNodeId?: string | null;
  /** Whether this choice is available */
  isAvailable?: boolean;
  /** Reason if unavailable */
  unavailableReason?: string;
}

export interface NarrativeState {
  /** Whether narrative panel is open */
  isOpen: boolean;
  /** History of all narrative entries in current session */
  entries: NarrativeEntry[];
  /** Current active choices for player */
  activeChoices: NarrativeChoice[];
  /** Current node ID (dialogue or story) */
  narrativeNodeId: string | null;
  /** Current examine data if showing object examination */
  currentExamineData: {
    title: string;
    description: string;
    detailText?: string;
    icon?: string;
    triggerZoneId?: string;
    hasLinkedContent?: boolean;
  } | null;
  /** Narrative mode: what type of content is being shown */
  narrativeMode: 'dialogue' | 'story' | 'examine' | 'mixed';
  /** Whether typewriter animation is done */
  typewriterDone: boolean;
  /** Source of current narrative (who/what triggered it) */
  narrativeSource?: {
    type: 'npc' | 'object' | 'story' | 'environment';
    id: string;
    name?: string;
  };
}

export interface NarrativeActions {
  /** Open narrative panel with initial content */
  openNarrative: (source?: NarrativeState['narrativeSource']) => void;
  /** Close narrative panel */
  closeNarrative: () => void;
  /** Add entry to narrative feed */
  addEntry: (entry: Omit<NarrativeEntry, 'id' | 'timestamp'>) => void;
  /** Set active choices for player */
  setActiveChoices: (choices: NarrativeChoice[]) => void;
  /** Clear active choices */
  clearChoices: () => void;
  /** Set current node ID */
  setNarrativeNodeId: (id: string | null) => void;
  /** Set examine data */
  setExamineData: (data: NarrativeState['currentExamineData']) => void;
  /** Clear examine data */
  clearExamineData: () => void;
  /** Set narrative mode */
  setNarrativeMode: (mode: NarrativeState['narrativeMode']) => void;
  /** Set typewriter done state */
  setTypewriterDone: (done: boolean) => void;
  /** Record player choice in history */
  recordPlayerChoice: (text: string) => void;
  /** Clear entire narrative history */
  clearHistory: () => void;
  /** Mark current entry as inactive (scrolling past) */
  deactivateCurrentEntry: () => void;
}

export type NarrativeSlice = NarrativeState & NarrativeActions;

/* ─── Helper to generate unique IDs ─── */
let entryIdCounter = 0;
function generateEntryId(): string {
  return `narrative-${Date.now()}-${++entryIdCounter}`;
}

/* ─── Slice creator ─── */
export const createNarrativeSlice: StateCreator<NarrativeSlice, [], [], NarrativeSlice> = (set, get) => ({
  /* ── Initial state ── */
  isOpen: false,
  entries: [],
  activeChoices: [],
  narrativeNodeId: null,
  currentExamineData: null,
  narrativeMode: 'dialogue',
  typewriterDone: true,
  narrativeSource: undefined,

  /* ── Actions ── */

  openNarrative: (source) => set({
    isOpen: true,
    narrativeSource: source,
  }),

  closeNarrative: () => set({
    isOpen: false,
    activeChoices: [],
    typewriterDone: true,
    // Keep entries for history but mark current as inactive
    entries: get().entries.map(e => ({ ...e, isActive: false })),
  }),

  addEntry: (entry) => set((state) => ({
    entries: [
      ...state.entries.map(e => ({ ...e, isActive: false })),
      {
        ...entry,
        id: generateEntryId(),
        timestamp: Date.now(),
        isActive: true,
      },
    ].slice(-100), // Keep last 100 entries for performance
  })),

  setActiveChoices: (choices) => set({ activeChoices: choices }),

  clearChoices: () => set({ activeChoices: [] }),

  setNarrativeNodeId: (id) => set({ narrativeNodeId: id }),

  setExamineData: (data) => set({ currentExamineData: data, narrativeMode: 'examine' }),

  clearExamineData: () => set({ currentExamineData: null }),

  setNarrativeMode: (narrativeMode) => set({ narrativeMode }),

  setTypewriterDone: (done) => set({ typewriterDone: done }),

  recordPlayerChoice: (text) => set((state) => ({
    entries: [
      ...state.entries.map(e => ({ ...e, isActive: false })),
      {
        id: generateEntryId(),
        type: 'player_choice' as const,
        timestamp: Date.now(),
        speaker: 'Володька',
        text,
        isActive: true,
      },
    ].slice(-100),
  })),

  clearHistory: () => set({ entries: [] }),

  deactivateCurrentEntry: () => set((state) => ({
    entries: state.entries.map(e => ({ ...e, isActive: false })),
  })),
});
