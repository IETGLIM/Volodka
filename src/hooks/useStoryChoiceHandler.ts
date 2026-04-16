import { useCallback } from 'react';
import type { StoryChoice, StoryEffect } from '@/data/types';
import { coreLoop } from '@/engine/CoreLoop';
import { statsEngine } from '@/engine/StatsEngine';
import { eventBus } from '@/engine/EventBus';
import { useGameStore } from '@/store/gameStore';
import { ENERGY_COSTS } from '@/hooks/useEnergySystem';

type EffectNotifType = 'poem' | 'stat' | 'quest' | 'flag' | 'energy';

interface StoryChoiceHandlerParams {
  playerSkills: Record<string, number>;
  energySystem: {
    canAfford: (amount: number) => boolean;
    consumeEnergy: (amount: number) => boolean;
  };
  showEffectNotif: (text: string, type: EffectNotifType) => void;
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
}

export function useStoryChoiceHandler(params: StoryChoiceHandlerParams) {
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
  } = params;

  const applyStoryEffect = useCallback((effect: StoryEffect) => {
    if (effect.mood) addStat('mood', effect.mood);
    if (effect.creativity) addStat('creativity', effect.creativity);
    if (effect.stability) addStat('stability', effect.stability);
    if (effect.energy) addStat('energy', effect.energy);
    if (effect.karma) addStat('karma', effect.karma);
    if (effect.selfEsteem) addStat('selfEsteem', effect.selfEsteem);
    if (effect.stress) {
      if (effect.stress > 0) addStress(effect.stress);
      else reduceStress(-effect.stress);
    }
    if (effect.poemId) collectPoem(effect.poemId);
    if (effect.setFlag) setFlag(effect.setFlag);
    if (effect.unsetFlag) unsetFlag(effect.unsetFlag);
    if (effect.npcId && effect.npcChange) updateNPCRelation(effect.npcId, effect.npcChange);
    if (effect.questStart) activateQuest(effect.questStart);
    if (effect.questComplete) completeQuest(effect.questComplete);
    if (effect.questObjective) {
      const { questId, objectiveId, value } = effect.questObjective;
      if (value !== undefined) {
        updateQuestObjective(questId, objectiveId, value);
      } else {
        incrementQuestObjective(questId, objectiveId);
      }
    }
    if (effect.questOperations) {
      effect.questOperations.forEach(op => {
        switch (op.type) {
          case 'start':
            activateQuest(op.questId);
            break;
          case 'complete':
            completeQuest(op.questId);
            break;
          case 'objective':
            if (op.objectiveId) {
              if (op.value !== undefined) {
                updateQuestObjective(op.questId, op.objectiveId, op.value);
              } else {
                incrementQuestObjective(op.questId, op.objectiveId);
              }
            }
            break;
        }
      });
    }
    if (effect.skillGains) {
      Object.entries(effect.skillGains).forEach(([k, v]) => {
        if (v) addSkill(k as 'writing', v);
      });
    }
    if (effect.itemReward) addItem(effect.itemReward, 1);
    if (effect.itemRemove) removeItem(effect.itemRemove, 1);
  }, [
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
  ]);

  const handleChoice = useCallback((choice: StoryChoice) => {
    const energyCost = choice.skillCheck ? ENERGY_COSTS.skillCheck : ENERGY_COSTS.choice;

    if (!energySystem.canAfford(energyCost)) {
      showEffectNotif('⚠️ Недостаточно энергии!', 'energy');
      return;
    }

    const consumed = energySystem.consumeEnergy(energyCost);
    if (!consumed) {
      showEffectNotif('⚠️ Недостаточно энергии!', 'energy');
      return;
    }

    if (choice.skillCheck) {
      const fromId = useGameStore.getState().currentNodeId;
      const skillValue = playerSkills[choice.skillCheck.skill] as number;
      const roll = skillValue + (Math.random() * 20 - 10);
      const success = roll >= choice.skillCheck.difficulty;
      const toId = success ? choice.skillCheck.successNext : choice.skillCheck.failNext;

      if (success) {
        if (choice.skillCheck.successEffect) applyStoryEffect(choice.skillCheck.successEffect);
        if (choice.effect) applyStoryEffect(choice.effect);
        setCurrentNode(choice.skillCheck.successNext);
      } else {
        if (choice.skillCheck.failEffect) applyStoryEffect(choice.skillCheck.failEffect);
        setCurrentNode(choice.skillCheck.failNext);
      }
      useGameStore.getState().pushChoiceLog({
        fromNodeId: fromId,
        choiceText: choice.text,
        toNodeId: toId,
        kind: 'skill',
        skillRollSuccess: success,
      });
      eventBus.emit('skill:check', {
        skill: choice.skillCheck.skill,
        difficulty: choice.skillCheck.difficulty,
        success,
        roll: Math.round(roll),
      });
      return;
    }

    const fromNodeId = useGameStore.getState().currentNodeId;

    coreLoop.processChoiceCycle(
      choice.next,
      choice.text,
      () => {
        if (choice.effect) applyStoryEffect(choice.effect);
        return choice.effect
          ? Object.keys(choice.effect).filter((k) => choice.effect![k as keyof StoryEffect])
          : [];
      },
      () => {
        const derivedEffects = statsEngine.getDerivedEffects(useGameStore.getState().playerState);
        return derivedEffects.availableActions;
      },
    );

    if (choice.next) {
      setCurrentNode(choice.next);
      useGameStore.getState().pushChoiceLog({
        fromNodeId,
        choiceText: choice.text,
        toNodeId: choice.next,
        kind: 'story',
      });
    }
  }, [energySystem, showEffectNotif, playerSkills, applyStoryEffect, setCurrentNode]);

  return {
    applyStoryEffect,
    handleChoice,
  };
}
