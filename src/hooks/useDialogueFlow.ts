import { useCallback, useState } from 'react';
import type { DialogueNode, DialogueEffect } from '@/data/rpgTypes';
import { NPC_DEFINITIONS } from '@/data/npcDefinitions';
import { eventBus } from '@/engine/EventBus';
import { applyDialogueEffects } from '@/engine/DialogueEngine';

interface DialogueStoreActions {
  addStat: (stat: 'mood' | 'creativity' | 'stability' | 'energy' | 'karma' | 'selfEsteem', amount: number) => void;
  addStress: (amount: number) => void;
  reduceStress: (amount: number) => void;
  setFlag: (flag: string) => void;
  unsetFlag: (flag: string) => void;
  updateNPCRelation: (npcId: string, change: number) => void;
  addItem: (itemId: string, quantity?: number) => void;
  removeItem: (itemId: string, quantity?: number) => void;
  activateQuest: (questId: string) => void;
  updateQuestObjective: (questId: string, objectiveId: string, value?: number) => void;
  collectPoem: (poemId: string) => void;
  addSkill: (skill: string, amount: number) => void;
}

interface ActiveDialogueState {
  npcId: string;
  npcName: string;
  node: DialogueNode;
}

interface UseDialogueFlowParams {
  setCurrentNPC: (npcId: string | null) => void;
  setGameMode: (mode: 'visual-novel' | 'exploration' | 'dialogue' | 'combat' | 'dream-sequence') => void;
  dialogueStoreActions: DialogueStoreActions;
}

export function useDialogueFlow({
  setCurrentNPC,
  setGameMode,
  dialogueStoreActions,
}: UseDialogueFlowParams) {
  const [activeDialogue, setActiveDialogue] = useState<ActiveDialogueState | null>(null);

  const handleDialogueEffect = useCallback((effect: DialogueEffect) => {
    applyDialogueEffects([effect], dialogueStoreActions);
  }, [dialogueStoreActions]);

  const handleNPCInteraction = useCallback((npcId: string) => {
    const npcDef = NPC_DEFINITIONS[npcId];
    if (!npcDef?.dialogueTree) return;

    setCurrentNPC(npcId);
    setActiveDialogue({
      npcId,
      npcName: npcDef.name,
      node: npcDef.dialogueTree as DialogueNode,
    });
    setGameMode('dialogue');

    eventBus.emit('npc:interacted', { npcId, npcName: npcDef.name });
  }, [setCurrentNPC, setGameMode]);

  const closeDialogue = useCallback(() => {
    setActiveDialogue(null);
    setCurrentNPC(null);
    setGameMode('visual-novel');
  }, [setCurrentNPC, setGameMode]);

  return {
    activeDialogue,
    handleDialogueEffect,
    handleNPCInteraction,
    closeDialogue,
  };
}
