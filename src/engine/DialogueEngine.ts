// ============================================
// DIALOGUE ENGINE — Диалоговый движок
// ============================================
// Обрабатывает диалоговые деревья с условиями,
// эффектами, проверками навыков и памятью NPC.

import { eventBus } from './EventBus';
import type {
  DialogueNode,
  DialogueChoice,
  DialogueCondition,
  DialogueEffect,
} from '@/data/rpgTypes';
import type { PlayerState, NPCRelation, PlayerSkills } from '@/data/types';

// ============================================
// ТИПЫ
// ============================================

export interface DialogueMemory {
  npcId: string;
  visitedNodes: string[];
  choicesMade: Array<{ nodeId: string; choiceText: string; timestamp: number }>;
  flagsSet: string[];
}

export interface DialogueContext {
  playerState: PlayerState;
  npcRelations: NPCRelation[];
  flags: Record<string, boolean>;
  inventory: string[];
  visitedNodes: string[];
  skills: PlayerSkills;
}

export interface DialogueChoiceResult {
  nextNode: DialogueNode | null;
  nextNodeId: string | null;
  effects: DialogueEffect[];
  skillCheckResult?: { success: boolean; skill: string; roll: number; difficulty: number };
  blocked?: boolean;
  blockReason?: string;
}

// ============================================
// ХРАНИЛИЩЕ ПАМЯТИ NPC
// ============================================

const npcMemories: Map<string, DialogueMemory> = new Map();

function getMemory(npcId: string): DialogueMemory {
  if (!npcMemories.has(npcId)) {
    npcMemories.set(npcId, {
      npcId,
      visitedNodes: [],
      choicesMade: [],
      flagsSet: [],
    });
  }
  return npcMemories.get(npcId)!;
}

export function clearMemory(npcId: string): void {
  npcMemories.delete(npcId);
}

export function clearAllMemories(): void {
  npcMemories.clear();
}

// ============================================
// ПРОВЕРКА УСЛОВИЙ
// ============================================

export function evaluateCondition(
  condition: DialogueCondition,
  context: DialogueContext
): boolean {
  // Флаги
  if (condition.hasFlag && !context.flags[condition.hasFlag]) return false;
  if (condition.notFlag && context.flags[condition.notFlag]) return false;

  // Предметы
  if (condition.hasItem && !context.inventory.includes(condition.hasItem)) return false;

  // NPC-отношения
  if (condition.minRelation) {
    const npc = context.npcRelations.find(
      (r) => r.id === condition.minRelation!.npcId
    );
    if (!npc || npc.value < condition.minRelation.value) return false;
  }

  // Навыки
  if (condition.minSkill) {
    const skillValue = context.skills[condition.minSkill.skill as keyof PlayerSkills];
    if (typeof skillValue !== 'number' || skillValue < condition.minSkill.value) return false;
  }

  if (condition.minKarma !== undefined && context.playerState.karma < condition.minKarma) return false;
  if (condition.maxKarma !== undefined && context.playerState.karma > condition.maxKarma) return false;

  // Посещённые узлы
  if (condition.visitedNode && !context.visitedNodes.includes(condition.visitedNode)) return false;

  // Пройденный диалог
  if (condition.completedDialogue) {
    const memory = getMemory(context.npcRelations[0]?.id || '');
    if (!memory.visitedNodes.includes(condition.completedDialogue)) return false;
  }

  return true;
}

/** Проверяет все условия (если их несколько) */
export function evaluateAllConditions(
  conditions: DialogueCondition[] | undefined,
  context: DialogueContext
): boolean {
  if (!conditions || conditions.length === 0) return true;
  return conditions.every((c) => evaluateCondition(c, context));
}

// ============================================
// ПРОВЕРКА НАВЫКОВ (SKILL CHECK)
// ============================================

function performSkillCheck(
  skill: string,
  difficulty: number,
  context: DialogueContext
): { success: boolean; roll: number } {
  const skillValue = context.skills[skill as keyof PlayerSkills];
  const baseValue = typeof skillValue === 'number' ? skillValue : 10;
  // Ролл: базовое значение + случайное число 1-20 (как D20)
  const roll = Math.floor(Math.random() * 20) + 1;
  const total = baseValue + roll;
  return { success: total >= difficulty, roll };
}

// ============================================
// ПРИМЕНЕНИЕ ЭФФЕКТОВ
// ============================================

export function applyDialogueEffects(
  effects: DialogueEffect[],
  storeActions: {
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
): void {
  for (const effect of effects) {
    // Характеристики
    if (effect.mood) storeActions.addStat('mood', effect.mood);
    if (effect.creativity) storeActions.addStat('creativity', effect.creativity);
    if (effect.stability) storeActions.addStat('stability', effect.stability);
    if (effect.stress) {
      if (effect.stress > 0) storeActions.addStress(effect.stress);
      else storeActions.reduceStress(-effect.stress);
    }
    if (effect.karma) storeActions.addStat('karma', effect.karma);

    // Флаги
    if (effect.setFlag) storeActions.setFlag(effect.setFlag);
    if (effect.unsetFlag) storeActions.unsetFlag(effect.unsetFlag);

    // NPC-отношения
    if (effect.npcRelation) {
      storeActions.updateNPCRelation(
        effect.npcRelation.npcId,
        effect.npcRelation.change
      );
    }

    // Предметы
    if (effect.giveItem) storeActions.addItem(effect.giveItem, 1);
    if (effect.removeItem) storeActions.removeItem(effect.removeItem, 1);

    // Квесты
    if (effect.questStart) storeActions.activateQuest(effect.questStart);
    if (effect.questObjective) {
      storeActions.updateQuestObjective(
        effect.questObjective.questId,
        effect.questObjective.objectiveId,
        1
      );
    }

    // Стихи
    if (effect.unlockPoem) storeActions.collectPoem(effect.unlockPoem);

    // Навыки
    if (effect.skillGains) {
      for (const [skill, amount] of Object.entries(effect.skillGains)) {
        if (amount) storeActions.addSkill(skill, amount);
      }
    }
  }
}

// ============================================
// ОБРАБОТКА ВЫБОРА В ДИАЛОГЕ
// ============================================

export function processDialogueChoice(
  choice: DialogueChoice,
  dialogueNodes: Record<string, DialogueNode>,
  context: DialogueContext,
  npcId: string
): DialogueChoiceResult {
  const memory = getMemory(npcId);

  // Проверяем условие выбора
  if (choice.condition && !evaluateCondition(choice.condition, context)) {
    return {
      nextNode: null,
      nextNodeId: null,
      effects: [],
      blocked: true,
      blockReason: 'Условие не выполнено',
    };
  }

  // Skill check
  if (choice.skillCheck) {
    const { success, roll } = performSkillCheck(
      choice.skillCheck.skill,
      choice.skillCheck.difficulty,
      context
    );

    const nextNodeId = success
      ? choice.skillCheck.successNext
      : choice.skillCheck.failNext;

    const nextNode = dialogueNodes[nextNodeId] || null;

    // Запоминаем выбор
    memory.choicesMade.push({
      nodeId: nextNodeId,
      choiceText: choice.text,
      timestamp: Date.now(),
    });

    // Эффекты успеха/провала
    const effects: DialogueEffect[] = [];
    if (success && choice.effect) effects.push(choice.effect);
    if (success && choice.skillCheck) {
      // Небольшой бонус за успешную проверку навыка
      effects.push({ mood: 3 });
    }
    if (!success) {
      effects.push({ stress: 5 });
    }

    // Эмитируем событие
    eventBus.emit('dialogue:choice_made', {
      npcId,
      choiceText: choice.text,
      nextNodeId,
    });

    return {
      nextNode,
      nextNodeId,
      effects,
      skillCheckResult: {
        success,
        skill: choice.skillCheck.skill,
        roll,
        difficulty: choice.skillCheck.difficulty,
      },
    };
  }

  // Обычный выбор
  const nextNodeId = choice.next;
  const nextNode = dialogueNodes[nextNodeId] || null;

  // Запоминаем выбор
  memory.choicesMade.push({
    nodeId: nextNodeId || 'end',
    choiceText: choice.text,
    timestamp: Date.now(),
  });

  // Собираем эффекты
  const effects: DialogueEffect[] = [];
  if (choice.effect) effects.push(choice.effect);

  // Квест-старт
  if (choice.questStart) {
    effects.push({ questStart: choice.questStart });
  }

  // Квест-объектив
  if (choice.questObjective) {
    effects.push({ questObjective: choice.questObjective });
  }

  // Эмитируем событие
  eventBus.emit('dialogue:choice_made', {
    npcId,
    choiceText: choice.text,
    nextNodeId: nextNodeId || 'end',
  });

  return {
    nextNode,
    nextNodeId,
    effects,
  };
}

// ============================================
// НАЧАЛО ДИАЛОГА
// ============================================

export function startDialogue(
  npcId: string,
  dialogueTree: DialogueNode,
  context: DialogueContext
): { node: DialogueNode; filteredChoices: DialogueChoice[] } {
  const memory = getMemory(npcId);

  // Запоминаем посещение
  if (!memory.visitedNodes.includes(dialogueTree.id)) {
    memory.visitedNodes.push(dialogueTree.id);
  }

  // Применяем входные эффекты
  const enterEffects: DialogueEffect[] = [];
  if (dialogueTree.effects) {
    enterEffects.push(...dialogueTree.effects);
  }
  if (dialogueTree.effect) {
    enterEffects.push(dialogueTree.effect);
  }

  // Фильтруем выборы по условиям
  const filteredChoices = (dialogueTree.choices || []).filter((choice) => {
    if (!choice.condition) return true;
    return evaluateCondition(choice.condition, context);
  });

  // Эмитируем событие
  eventBus.emit('dialogue:started', {
    npcId,
    dialogueId: dialogueTree.id,
  });

  return { node: dialogueTree, filteredChoices };
}

// ============================================
// КОНЕЦ ДИАЛОГА
// ============================================

export function endDialogue(npcId: string, dialogueId: string): void {
  eventBus.emit('dialogue:ended', { npcId, dialogueId });
}
