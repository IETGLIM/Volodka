import type { ReactNode } from 'react';

export interface SecondaryAction {
  icon: ReactNode;
  label: string;
  shortcut?: string;
  onClick?: () => void;
  badge?: number;
}

export interface HudOverflowSection {
  title: string;
  actions: SecondaryAction[];
}

export type HUDProps = {
  onOpenQuests?: () => void;
  onOpenInventory?: () => void;
  onOpenPoetry?: () => void;
  onOpenJournal?: () => void;
  onToggleTutorials?: () => void;
  onOpenMenu?: () => void;
  onOpenMiniGames?: () => void;
  onOpenCharacterProfile?: () => void;
  onOpenNPCRelations?: () => void;
  onOpenCodex?: () => void;
  onOpenDialogueHistory?: () => void;
  onOpenAchievements?: () => void;
  onOpenSkillTree?: () => void;
  onOpenCrafting?: () => void;
  onOpenTrading?: () => void;
  onOpenFastTravel?: () => void;
  onOpenPerks?: () => void;
  onOpenQuestBoard?: () => void;
  onOpenStats?: () => void;
};
