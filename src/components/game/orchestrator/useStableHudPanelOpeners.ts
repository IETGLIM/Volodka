import { useMemo, useRef, type Dispatch } from 'react';
import type { PanelType } from './types';

/** Stable LazyHUD panel openers — avoids inline lambdas on every gameplay-layer render. */
export interface HudSecondaryPanelOpeners {
  onOpenMiniGames: () => void;
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
}

export function useStableHudPanelOpeners(
  dispatchPanel: Dispatch<PanelType>,
): HudSecondaryPanelOpeners {
  const dispatchRef = useRef(dispatchPanel);
  dispatchRef.current = dispatchPanel;

  return useMemo(
    () => ({
      onOpenMiniGames: () => dispatchRef.current('miniGameHub'),
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
    }),
    [],
  );
}
