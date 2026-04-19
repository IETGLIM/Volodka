import type { GameMode } from '@/data/rpgTypes';

export type InteractionContext = {
  setGameMode: (mode: GameMode) => void;
  /** Wired from exploration; opens the same dialogue flow as pressing E on an NPC mesh. */
  onNPCInteraction?: (npcId: string) => void;
  /** Optional hooks for quest-side interactions (`InteractionRegistry`). */
  activateQuest?: (questId: string) => void;
  incrementQuestObjective?: (questId: string, objectiveId: string) => void;
  completeQuest?: (questId: string) => void;
  isQuestActive?: (questId: string) => boolean;
  isQuestCompleted?: (questId: string) => boolean;
  getQuestProgress?: (questId: string) => Record<string, number>;
};
