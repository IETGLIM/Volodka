/* ─── GameOrchestrator sub-module types ─── */

/** Single source of truth for stackable panel ids — add new panels here only. */
export const PANEL_IDS = [
  'quests',
  'inventory',
  'poetry',
  'menu',
  'rest',
  'shortcuts',
  'settings',
  'saveSlot',
  'miniGameHub',
  'npcRelation',
  'characterProfile',
  'codex',
  'dialogueHistory',
  'achievements',
  'skillTree',
  'crafting',
  'trading',
  'fastTravel',
  'perks',
  'questBoard',
  'stats',
  'karmaPoem',
  'journal',
] as const;

export type NonNullPanelType = (typeof PANEL_IDS)[number];
export type PanelType = NonNullPanelType | null;

export type CanvasTransitionState = {
  canvasReady: boolean;
  isTransitioning: boolean;
  fadeOutMs: number;
};

export type QuestChainUnlockState = {
  nextQuestTitle: string;
  nextQuestType: string;
  completedQuestTitle: string;
  npcId?: string;
  actNumber: number;
};

export type QuestDialogState = {
  questId: string;
  npcId?: string;
} | null;

export type MatrixQuoteState = {
  text: string;
  actNumber: number;
} | null;
