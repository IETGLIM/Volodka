import { useMemo, useRef, type Dispatch } from 'react';
import type { PanelType } from './types';

/** Stable LazyHUD panel openers — avoids inline lambdas on every gameplay-layer render. */
export interface HudSecondaryPanelOpeners {
  onOpenMiniGames: () => void;
  onOpenWorldMap: () => void;
  onOpenCharacterProfile: () => void;
  onOpenNPCRelations: () => void;
  onOpenCodex: () => void;
  onOpenDialogueHistory: () => void;
  onOpenAchievements: () => void;
  onOpenSkillTree: () => void;
  onOpenCrafting: () => void;
  onOpenTrading: () => void;
  onOpenFastTravel: () => void;
  onOpenPerks: () => void;
  onOpenQuestBoard: () => void;
  onOpenStats: () => void;
  onOpenSaveSlots: () => void;
  onOpenNpcCodex: () => void;
  onOpenFactionReputation: () => void;
  onOpenAdventureLog: () => void;
  onOpenGameStats: () => void;
}

export function useStableHudPanelOpeners(
  dispatchPanel: Dispatch<PanelType>,
): HudSecondaryPanelOpeners {
  const dispatchRef = useRef(dispatchPanel);
  dispatchRef.current = dispatchPanel;

  return useMemo(
    () => ({
      onOpenMiniGames: () => dispatchRef.current('miniGameHub'),
      onOpenWorldMap: () => dispatchRef.current('worldMap'),
      onOpenCharacterProfile: () => dispatchRef.current('characterProfile'),
      onOpenNPCRelations: () => dispatchRef.current('npcRelation'),
      onOpenCodex: () => dispatchRef.current('codex'),
      onOpenDialogueHistory: () => dispatchRef.current('dialogueHistory'),
      onOpenAchievements: () => dispatchRef.current('achievements'),
      onOpenSkillTree: () => dispatchRef.current('skillTree'),
      onOpenCrafting: () => dispatchRef.current('crafting'),
      onOpenTrading: () => dispatchRef.current('trading'),
      onOpenFastTravel: () => dispatchRef.current('fastTravel'),
      onOpenPerks: () => dispatchRef.current('perks'),
      onOpenQuestBoard: () => dispatchRef.current('questBoard'),
      onOpenStats: () => dispatchRef.current('stats'),
      onOpenSaveSlots: () => dispatchRef.current('saveSlot'),
      onOpenNpcCodex: () => dispatchRef.current('npcCodex'),
      onOpenFactionReputation: () => dispatchRef.current('factionReputation'),
      onOpenAdventureLog: () => dispatchRef.current('adventureLog'),
      onOpenGameStats: () => dispatchRef.current('gameStats'),
    }),
    [],
  );
}
