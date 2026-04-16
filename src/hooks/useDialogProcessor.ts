'use client';

import { useMemo } from 'react';
import { useDialogueFlow } from '@/hooks/useDialogueFlow';
import type { StoreActionAdapter } from '@/hooks/useGameRuntime';
import type { GameMode } from '@/data/rpgTypes';
import type { PlayerSkills } from '@/data/types';
import { asTrainablePlayerSkill } from '@/lib/trainablePlayerSkill';

export interface UseDialogProcessorParams {
  setCurrentNPC: (npcId: string | null) => void;
  setGameMode: (mode: GameMode) => void;
  setCurrentNode: (nodeId: string) => void;
  addStat: StoreActionAdapter['addStat'];
  addStress: StoreActionAdapter['addStress'];
  reduceStress: StoreActionAdapter['reduceStress'];
  setFlag: StoreActionAdapter['setFlag'];
  unsetFlag: StoreActionAdapter['unsetFlag'];
  updateNPCRelation: StoreActionAdapter['updateNPCRelation'];
  addItem: StoreActionAdapter['addItem'];
  removeItem: StoreActionAdapter['removeItem'];
  activateQuest: StoreActionAdapter['activateQuest'];
  updateQuestObjective: StoreActionAdapter['updateQuestObjective'];
  collectPoem: StoreActionAdapter['collectPoem'];
  addSkill: (skill: keyof PlayerSkills, amount: number) => void;
}

/**
 * Диалоговый слой: адаптер стора для последствий, `useDialogueFlow`, клик по NPC на сцене.
 */
export function useDialogProcessor(params: UseDialogProcessorParams) {
  const {
    setCurrentNPC,
    setGameMode,
    setCurrentNode,
    addStat,
    addStress,
    reduceStress,
    setFlag,
    unsetFlag,
    updateNPCRelation,
    addItem,
    removeItem,
    activateQuest,
    updateQuestObjective,
    collectPoem,
    addSkill,
  } = params;

  const dialogueStoreActions: StoreActionAdapter = useMemo(
    () => ({
      addStat,
      addStress,
      reduceStress,
      setFlag,
      unsetFlag,
      updateNPCRelation,
      addItem,
      removeItem,
      activateQuest,
      updateQuestObjective,
      collectPoem,
      addSkill: (skill: string, amount: number) => {
        const k = asTrainablePlayerSkill(skill);
        if (k != null) addSkill(k, amount);
      },
    }),
    [
      addStat,
      addStress,
      reduceStress,
      setFlag,
      unsetFlag,
      updateNPCRelation,
      addItem,
      removeItem,
      activateQuest,
      updateQuestObjective,
      collectPoem,
      addSkill,
    ],
  );

  const {
    activeDialogue,
    handleDialogueEffect,
    handleNPCInteraction: openNpcDialogue,
    openDialogueFromStory,
    closeDialogue,
  } = useDialogueFlow({
    setCurrentNPC,
    setGameMode,
    dialogueStoreActions,
    setCurrentNode,
  });

  return {
    dialogueStoreActions,
    activeDialogue,
    handleDialogueEffect,
    openNpcDialogue,
    openDialogueFromStory,
    closeDialogue,
  };
}
