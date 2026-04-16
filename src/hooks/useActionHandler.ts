'use client';

import { useGameStore } from '@/store/gameStore';
import { useStoryChoiceHandler } from '@/hooks/useStoryChoiceHandler';
import { useGameUiLayout } from '@/hooks/useGameUiLayout';
import { useGameSessionFlow } from '@/hooks/useGameSessionFlow';
import { usePanicFlow } from '@/hooks/usePanicFlow';
import type { EnergySystemAPI } from '@/hooks/useEnergySystem';
import type { GamePanelsState } from '@/hooks/useGamePanels';
import type { GameMode } from '@/data/rpgTypes';

export type OpenDialogueFromStoryPayload = {
  npcId: string;
  nextNodeId: string;
  fromNodeId: string;
  choiceText: string;
};

export interface UseActionHandlerParams {
  playerSkills: Record<string, number>;
  energySystem: EnergySystemAPI;
  showEffectNotif: (
    text: string,
    type: 'poem' | 'stat' | 'quest' | 'flag' | 'energy',
    durationMs?: number,
  ) => void;
  setCurrentNode: (nodeId: string) => void;
  addStat: (stat: 'mood' | 'creativity' | 'stability' | 'energy' | 'karma' | 'selfEsteem', amount: number) => void;
  addStress: (amount: number) => void;
  reduceStress: (amount: number) => void;
  collectPoem: (poemId: string) => void;
  setFlag: (flag: string) => void;
  unsetFlag: (flag: string) => void;
  updateNPCRelation: (npcId: string, change: number) => void;
  activateQuest: (questId: string) => void;
  completeQuest: (questId: string) => void;
  incrementQuestObjective: (questId: string, objectiveId: string) => void;
  updateQuestObjective: (questId: string, objectiveId: string, value?: number) => void;
  addSkill: (skill: 'writing', amount: number) => void;
  addItem: (itemId: string, quantity?: number) => void;
  removeItem: (itemId: string, quantity?: number) => void;
  openDialogueFromStory: (p: OpenDialogueFromStoryPayload) => void;
  phase: 'loading' | 'intro' | 'menu' | 'game';
  gameMode: GameMode;
  currentNodeId: string;
  hasCurrentNode: boolean;
  togglePanel: (key: keyof GamePanelsState) => void;
  setPhase: (phase: 'loading' | 'intro' | 'menu' | 'game') => void;
  setGameMode: (mode: GameMode) => void;
  saveGameToStore: () => void;
  loadGameFromStore: () => boolean;
  resetGameStore: () => void;
  showSaveNotif: (message: string) => void;
  clearPanicMode: () => void;
}

/**
 * Сюжетные выборы, панели HUD, меню/сейв, паника — действия игрока вне чистого рендера сцены.
 */
export function useActionHandler(params: UseActionHandlerParams) {
  const {
    playerSkills,
    energySystem,
    showEffectNotif,
    setCurrentNode,
    addStat,
    addStress,
    reduceStress,
    collectPoem,
    setFlag,
    unsetFlag,
    updateNPCRelation,
    activateQuest,
    completeQuest,
    incrementQuestObjective,
    updateQuestObjective,
    addSkill,
    addItem,
    removeItem,
    openDialogueFromStory,
    phase,
    gameMode,
    currentNodeId,
    hasCurrentNode,
    togglePanel,
    setPhase,
    setGameMode,
    saveGameToStore,
    loadGameFromStore,
    resetGameStore,
    showSaveNotif,
    clearPanicMode,
  } = params;

  const { handleChoice } = useStoryChoiceHandler({
    playerSkills,
    energySystem,
    showEffectNotif,
    setCurrentNode,
    addStat,
    addStress,
    reduceStress,
    collectPoem,
    setFlag,
    unsetFlag,
    updateNPCRelation,
    activateQuest,
    completeQuest,
    incrementQuestObjective,
    updateQuestObjective,
    addSkill,
    addItem,
    removeItem,
    openDialogueFromStory,
  });

  const { showStoryPanel, handleTogglePanel } = useGameUiLayout({
    phase,
    gameMode,
    currentNodeId,
    hasCurrentNode,
    togglePanel,
  });

  const session = useGameSessionFlow({
    setPhase,
    setGameMode,
    setCurrentNode,
    saveGameToStore,
    loadGameFromStore,
    resetGameStore,
    showSaveNotif,
  });

  const { handleCalmDown } = usePanicFlow({
    clearPanicMode,
    reduceStress,
    getCurrentStress: () => useGameStore.getState().playerState.stress,
  });

  return {
    handleChoice,
    showStoryPanel,
    handleTogglePanel,
    ...session,
    handleCalmDown,
  };
}
