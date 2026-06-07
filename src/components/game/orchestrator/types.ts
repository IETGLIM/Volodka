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

export type PanelFlags = {
  questsOpen: boolean;
  inventoryOpen: boolean;
  poetryOpen: boolean;
  menuOpen: boolean;
  restOpen: boolean;
  shortcutsOpen: boolean;
  settingsOpen: boolean;
  saveSlotOpen: boolean;
  miniGameHubOpen: boolean;
  npcRelationOpen: boolean;
  characterProfileOpen: boolean;
  codexOpen: boolean;
  dialogueHistoryOpen: boolean;
  achievementsOpen: boolean;
  skillTreeOpen: boolean;
  craftingOpen: boolean;
  tradingOpen: boolean;
  fastTravelOpen: boolean;
  perksOpen: boolean;
  questBoardOpen: boolean;
  statsOpen: boolean;
  karmaPoemOpen: boolean;
  journalOpen: boolean;
};
