/* ─── GameOrchestrator sub-module types ─── */

export type PanelType =
  | 'quests'
  | 'inventory'
  | 'poetry'
  | 'menu'
  | 'rest'
  | 'shortcuts'
  | 'settings'
  | 'saveSlot'
  | 'miniGameHub'
  | 'npcRelation'
  | 'characterProfile'
  | 'codex'
  | 'dialogueHistory'
  | 'achievements'
  | 'skillTree'
  | 'crafting'
  | 'trading'
  | 'fastTravel'
  | 'perks'
  | 'questBoard'
  | 'stats'
  | 'karmaPoem'
  | 'journal'
  | null;

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

export type MatrixQuoteState = {
  text: string;
  actNumber: number;
} | null;
