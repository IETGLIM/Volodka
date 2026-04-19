import type { GameMode } from '@/data/rpgTypes';

export type InteractionContext = {
  setGameMode: (mode: GameMode) => void;
  /** Wired from exploration; opens the same dialogue flow as pressing E on an NPC mesh. */
  onNPCInteraction?: (npcId: string) => void;
};
