import { useState, useCallback, useMemo } from 'react';
import { STORY_NODES } from '../data/storyNodes';
import type { StoryNode, StoryChoice, StoryEffect, PlayerSkills, NPCRelation } from '../data/types';

interface StoryEngineOptions {
  initialNodeId?: string;
  playerSkills: PlayerSkills;
  playerFlags: Record<string, boolean>;
  inventory: string[];
  npcRelations: NPCRelation[];
}

interface ChoiceAvailability {
  choice: StoryChoice;
  available: boolean;
  lockReason?: string;
}

interface StoryEngineResult {
  currentNode: StoryNode | undefined;
  availableChoices: ChoiceAvailability[];
  makeChoice: (choice: StoryChoice) => void;
  currentNodeId: string;
  setCurrentNodeId: (id: string) => void;
  applyEffect: (effect: StoryEffect) => StoryEffectResult;
}

interface StoryEffectResult {
  skillGains?: Partial<Record<keyof PlayerSkills, number>>;
  statChanges?: {
    mood?: number;
    creativity?: number;
    stability?: number;
    energy?: number;
    karma?: number;
    stress?: number;
  };
  itemReward?: string;
  poemId?: string;
  npcChanges?: { npcId: string; change: number }[];
  flagChanges?: { set?: string; unset?: string };
}

/**
 * Хук для управления сюжетом с проверкой условий
 */
export function useStoryEngine({
  initialNodeId = 'start',
  playerSkills,
  playerFlags,
  inventory,
  npcRelations,
}: StoryEngineOptions): StoryEngineResult {
  const [currentNodeId, setCurrentNodeId] = useState(initialNodeId);
  
  // Получаем текущий узел
  const currentNode = STORY_NODES[currentNodeId];
  
  // Проверка условий для выбора
  const checkChoiceCondition = useCallback((choice: StoryChoice): { available: boolean; lockReason?: string } => {
    const condition = choice.condition;
    
    if (!condition) {
      return { available: true };
    }
    
    // Проверка флага
    if (condition.hasFlag && !playerFlags[condition.hasFlag]) {
      return { 
        available: false, 
        lockReason: `Требуется: ${condition.hasFlag}` 
      };
    }
    
    // Проверка отсутствия флага
    if (condition.notFlag && playerFlags[condition.notFlag]) {
      return { 
        available: false, 
        lockReason: 'Недоступно из-за предыдущего выбора' 
      };
    }
    
    // Проверка предмета
    if (condition.hasItem && !inventory.includes(condition.hasItem)) {
      return { 
        available: false, 
        lockReason: `Требуется предмет: ${condition.hasItem}` 
      };
    }
    
    // Проверка навыка
    if (condition.stat && condition.min !== undefined) {
      const skillValue = playerSkills[condition.stat as keyof PlayerSkills];
      if (typeof skillValue === 'number' && skillValue < condition.min) {
        return { 
          available: false, 
          lockReason: `Требуется ${condition.stat}: ${condition.min}` 
        };
      }
    }
    
    // Проверка отношений с NPC
    if (condition.minRelation) {
      const npc = npcRelations.find(r => r.id === condition.minRelation!.npcId);
      if (!npc || npc.value < condition.minRelation.value) {
        return { 
          available: false, 
          lockReason: 'Недостаточно доверия' 
        };
      }
    }
    
    // Проверка посещённого узла
    if (condition.visitedNode) {
      // Можно расширить, добавив visitedNodes в параметры
      return { available: true };
    }
    
    return { available: true };
  }, [playerFlags, inventory, playerSkills, npcRelations]);
  
  // Фильтруем доступные выборы
  const availableChoices = useMemo((): ChoiceAvailability[] => {
    if (!currentNode?.choices) return [];
    
    return currentNode.choices.map(choice => {
      const { available, lockReason } = checkChoiceCondition(choice);
      return { choice, available, lockReason };
    });
  }, [currentNode, checkChoiceCondition]);
  
  // Применение эффекта
  const applyEffect = useCallback((effect: StoryEffect): StoryEffectResult => {
    const result: StoryEffectResult = {};
    
    // Изменения характеристик
    if (effect.mood || effect.creativity || effect.stability || effect.energy || effect.karma || effect.stress) {
      result.statChanges = {
        mood: effect.mood,
        creativity: effect.creativity,
        stability: effect.stability,
        energy: effect.energy,
        karma: effect.karma,
        stress: effect.stress,
      };
    }
    
    // Прирост навыков
    if (effect.skillGains) {
      result.skillGains = effect.skillGains;
    }
    
    // Прямые изменения навыков
    if (effect.perception || effect.introspection) {
      result.skillGains = {
        ...result.skillGains,
        perception: effect.perception,
        introspection: effect.introspection,
      };
    }
    
    // Предмет
    if (effect.itemReward) {
      result.itemReward = effect.itemReward;
    }
    
    // Стих
    if (effect.poemId) {
      result.poemId = effect.poemId;
    }
    
    // Изменение отношений с NPC
    if (effect.npcId && effect.npcChange) {
      result.npcChanges = [{ npcId: effect.npcId, change: effect.npcChange }];
    }
    
    // Флаги
    if (effect.setFlag || effect.unsetFlag) {
      result.flagChanges = {
        set: effect.setFlag,
        unset: effect.unsetFlag,
      };
    }
    
    return result;
  }, []);
  
  // Совершить выбор
  const makeChoice = useCallback((choice: StoryChoice) => {
    // Если есть проверка навыка
    if (choice.skillCheck) {
      const skillValue = playerSkills[choice.skillCheck.skill] as number;
      const success = skillValue >= choice.skillCheck.difficulty;
      
      // Переходим к соответствующему узлу
      if (success) {
        if (choice.skillCheck.successEffect) {
          applyEffect(choice.skillCheck.successEffect);
        }
        setCurrentNodeId(choice.skillCheck.successNext);
      } else {
        if (choice.skillCheck.failEffect) {
          // Можно добавить эффекты неудачи
        }
        setCurrentNodeId(choice.skillCheck.failNext);
      }
      return;
    }
    
    // Обычный выбор
    if (choice.effect) {
      applyEffect(choice.effect);
    }
    setCurrentNodeId(choice.next);
  }, [playerSkills, applyEffect]);
  
  return {
    currentNode,
    availableChoices,
    makeChoice,
    currentNodeId,
    setCurrentNodeId,
    applyEffect,
  };
}

/**
 * Проверка достижения навыка
 */
export function checkSkillRequirement(
  skills: PlayerSkills,
  skill: keyof PlayerSkills,
  difficulty: number
): { success: boolean; roll: number } {
  const skillValue = skills[skill] as number;
  // Добавляем случайность: навык ± 20
  const roll = skillValue + (Math.random() * 40 - 20);
  return {
    success: roll >= difficulty,
    roll: Math.round(roll),
  };
}

/**
 * Вычисление эффекта морального выбора
 */
export function calculateMoralEffect(
  moralType: 'selfless' | 'selfish' | 'neutral' | 'chaotic'
): StoryEffect {
  switch (moralType) {
    case 'selfless':
      return { karma: 10, stress: 5, skillGains: { empathy: 2 } };
    case 'selfish':
      return { karma: -5, mood: 5, stress: -5 };
    case 'neutral':
      return { karma: 2 };
    case 'chaotic':
      return { karma: -10, creativity: 5, stress: 10, skillGains: { intuition: 2 } };
  }
}

export default useStoryEngine;
