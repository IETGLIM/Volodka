import { useCallback, useRef, useState } from 'react';
import type { DialogueNode, DialogueEffect, GameMode } from '@/data/rpgTypes';
import { resolveDialogueVariant } from '@/core/dialogue/resolveDialogueVariant';
import { NPC_DEFINITIONS } from '@/data/npcDefinitions';
import { eventBus } from '@/engine/EventBus';
import { applyDialogueEffects } from '@/engine/DialogueEngine';
import { useGameStore } from '@/store/gameStore';

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

export interface StoryDialogueResume {
  nextNodeId: string;
  fromNodeId: string;
  choiceText: string;
}

interface ActiveDialogueState {
  npcId: string;
  npcName: string;
  node: DialogueNode;
  storyResume?: StoryDialogueResume;
}

interface UseDialogueFlowParams {
  setCurrentNPC: (npcId: string | null) => void;
  setGameMode: (mode: GameMode) => void;
  dialogueStoreActions: DialogueStoreActions;
  setCurrentNode: (nodeId: string) => void;
}

export function useDialogueFlow({
  setCurrentNPC,
  setGameMode,
  dialogueStoreActions,
  setCurrentNode,
}: UseDialogueFlowParams) {
  const [activeDialogue, setActiveDialogue] = useState<ActiveDialogueState | null>(null);
  /** После диалога возвращаемся в тот же полевой режим (обычно `exploration`). */
  const gameModeBeforeDialogueRef = useRef<GameMode>('exploration');

  const handleDialogueEffect = useCallback((effect: DialogueEffect) => {
    applyDialogueEffects([effect], dialogueStoreActions);
  }, [dialogueStoreActions]);

  const handleNPCInteraction = useCallback((npcId: string) => {
    const npcDef = NPC_DEFINITIONS[npcId];
    if (!npcDef?.dialogueTree) return;

    const root = npcDef.dialogueTree as DialogueNode;
    const node = resolveDialogueVariant(npcId, root);

    gameModeBeforeDialogueRef.current = useGameStore.getState().gameMode;
    setCurrentNPC(npcId);
    setActiveDialogue({
      npcId,
      npcName: npcDef.name,
      node,
    });
    setGameMode('dialogue');

    eventBus.emit('npc:interacted', { npcId, npcName: npcDef.name });
  }, [setCurrentNPC, setGameMode]);

  /** Встроенный диалог из сюжетного выбора: после закрытия — переход на nextNodeId */
  const openDialogueFromStory = useCallback(
    (params: { npcId: string; nextNodeId: string; fromNodeId: string; choiceText: string }) => {
      const npcDef = NPC_DEFINITIONS[params.npcId];
      if (!npcDef?.dialogueTree) return;

      const root = npcDef.dialogueTree as DialogueNode;
      const node = resolveDialogueVariant(params.npcId, root);

      gameModeBeforeDialogueRef.current = useGameStore.getState().gameMode;
      setCurrentNPC(params.npcId);
      setActiveDialogue({
        npcId: params.npcId,
        npcName: npcDef.name,
        node,
        storyResume: {
          nextNodeId: params.nextNodeId,
          fromNodeId: params.fromNodeId,
          choiceText: params.choiceText,
        },
      });
      setGameMode('dialogue');
      eventBus.emit('npc:interacted', { npcId: params.npcId, npcName: npcDef.name });
    },
    [setCurrentNPC, setGameMode],
  );

  const closeDialogue = useCallback(() => {
    setActiveDialogue((current) => {
      if (current?.storyResume) {
        const { nextNodeId, fromNodeId, choiceText } = current.storyResume;
        queueMicrotask(() => {
          setCurrentNode(nextNodeId);
          useGameStore.getState().pushChoiceLog({
            fromNodeId,
            choiceText,
            toNodeId: nextNodeId,
            kind: 'story',
          });
        });
      }
      return null;
    });
    setCurrentNPC(null);
    setGameMode(gameModeBeforeDialogueRef.current);
  }, [setCurrentNPC, setGameMode, setCurrentNode]);

  return {
    activeDialogue,
    handleDialogueEffect,
    handleNPCInteraction,
    openDialogueFromStory,
    closeDialogue,
  };
}
