"use client";

import { useState, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { DialogueNode, DialogueChoice, DialogueEffect, DialogueCondition } from '@/data/rpgTypes';
import type { PlayerState, NPCRelation } from '@/data/types';
import { DIALOGUE_NODES } from '@/data/npcDefinitions';

// ============================================
// ДИАЛОГОВОЕ ОКНО
// ============================================

interface DialogueWindowProps {
  dialogueTree: DialogueNode;
  npcName: string;
  playerState: PlayerState;
  npcRelations: NPCRelation[];
  flags: Record<string, boolean>;
  inventory: string[];
  visitedNodes: string[];
  onClose: () => void;
  onEffect: (effect: DialogueEffect) => void;
  onStartDialogue: (nodeId: string) => void;
}

export const DialogueWindow = memo(function DialogueWindow({
  dialogueTree,
  npcName,
  playerState,
  npcRelations,
  flags,
  inventory,
  visitedNodes,
  onClose,
  onEffect,
  onStartDialogue,
}: DialogueWindowProps) {
  const [currentNode, setCurrentNode] = useState<DialogueNode>(dialogueTree);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [charIndex, setCharIndex] = useState(0);

  // Эффект печатания текста
  useEffect(() => {
    // Защита от пустого текста
    const text = currentNode?.text || '';
    if (charIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(text.slice(0, charIndex + 1));
        setCharIndex(charIndex + 1);
      }, 30);
      return () => clearTimeout(timer);
    } else if (charIndex >= text.length && isTyping) {
      const timer = setTimeout(() => setIsTyping(false), 0);
      return () => clearTimeout(timer);
    }
  }, [charIndex, currentNode?.text, isTyping]);

  // Сброс при смене узла
  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayedText('');
      setCharIndex(0);
      setIsTyping(true);
    }, 0);
    return () => clearTimeout(timer);
  }, [currentNode?.id]);

  // Проверка условий выбора
  const checkCondition = useCallback((condition?: DialogueCondition): boolean => {
    if (!condition) return true;

    if (condition.hasFlag && !flags[condition.hasFlag]) return false;
    if (condition.notFlag && flags[condition.notFlag]) return false;
    if (condition.hasItem && !inventory.includes(condition.hasItem)) return false;
    if (condition.visitedNode && !visitedNodes.includes(condition.visitedNode)) return false;

    if (condition.minRelation) {
      const npc = npcRelations.find(r => r.id === condition.minRelation!.npcId);
      if (!npc || npc.value < condition.minRelation.value) return false;
    }

    if (condition.minSkill) {
      const skillValue = playerState.skills[condition.minSkill.skill as keyof typeof playerState.skills];
      if (typeof skillValue !== 'number' || skillValue < condition.minSkill.value) return false;
    }

    return true;
  }, [flags, inventory, visitedNodes, npcRelations, playerState.skills]);

  // Применение эффектов
  const applyEffect = useCallback((effect?: DialogueEffect) => {
    if (!effect) return;
    onEffect(effect);
  }, [onEffect]);

  // Загрузка узла диалога по ID
  const loadDialogueNode = useCallback((nodeId: string): DialogueNode => {
    // Ищем узел в DIALOGUE_NODES
    const node = DIALOGUE_NODES[nodeId];
    if (node) {
      return node;
    }
    // Если не нашли, возвращаем узел с сообщением об ошибке
    return {
      id: nodeId,
      text: `[Узел "${nodeId}" не найден]`,
    };
  }, []);

  // Выбор варианта
  const handleChoice = useCallback((choice: DialogueChoice) => {
    // Проверяем skill check
    if (choice.skillCheck) {
      const skillValue = playerState.skills[choice.skillCheck.skill as keyof typeof playerState.skills] as number;
      const roll = skillValue + Math.floor(Math.random() * 41) - 20; // -20 to +20
      
      if (roll >= choice.skillCheck.difficulty) {
        // Успех - загружаем узел из DIALOGUE_NODES
        const successNode = loadDialogueNode(choice.skillCheck.successNext);
        setCurrentNode(successNode);
        onStartDialogue(choice.skillCheck.successNext);
      } else {
        // Провал - загружаем узел из DIALOGUE_NODES
        const failNode = loadDialogueNode(choice.skillCheck.failNext);
        setCurrentNode(failNode);
        onStartDialogue(choice.skillCheck.failNext);
      }
      applyEffect(choice.effect);
      return;
    }

    // Обычный выбор
    applyEffect(choice.effect);
    
    if (choice.next) {
      // Загружаем следующий узел из DIALOGUE_NODES
      const nextNode = loadDialogueNode(choice.next);
      setCurrentNode(nextNode);
      onStartDialogue(choice.next);
    } else {
      // Если нет следующего узла - закрываем диалог
      setTimeout(() => onClose(), 500);
    }
  }, [playerState.skills, applyEffect, onStartDialogue, loadDialogueNode, onClose]);

  // Пропуск печатания
  const skipTyping = useCallback(() => {
    const text = currentNode?.text || '';
    if (isTyping) {
      setDisplayedText(text);
      setCharIndex(text.length);
      setIsTyping(false);
    } else if (currentNode.autoNext) {
      const nextNode = loadDialogueNode(currentNode.autoNext);
      setCurrentNode(nextNode);
    }
  }, [isTyping, currentNode, loadDialogueNode]);

  // Автоматическое закрытие когда диалог закончился
  useEffect(() => {
    if (!isTyping && !currentNode.choices?.length && !currentNode.autoNext) {
      // Небольшая задержка чтобы игрок успел прочитать последний текст
      const timer = setTimeout(() => {
        onClose();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isTyping, currentNode, onClose]);

  // Закрытие по Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Фильтруем доступные выборы
  const availableChoices = (currentNode.choices || []).filter(c => checkCondition(c.condition));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/30 backdrop-blur-sm"
      onClick={skipTyping}
    >
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="w-full max-w-3xl bg-slate-900/95 border border-slate-700 rounded-t-xl p-6 shadow-2xl relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Кнопка закрытия (крестик) */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:border-red-500 text-slate-400 hover:text-red-400 transition-all duration-200 z-10"
          title="Закрыть (Esc)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        
        {/* Имя NPC */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-white font-bold">
            {npcName.charAt(0)}
          </div>
          <div>
            <h3 className="text-white font-medium">{npcName}</h3>
            {currentNode.speaker && (
              <p className="text-slate-400 text-sm">{currentNode.speaker}</p>
            )}
          </div>
        </div>

        {/* Текст диалога */}
        <div className="min-h-[80px] mb-6">
          <p className="text-slate-200 text-lg leading-relaxed">
            {displayedText}
            {isTyping && <span className="animate-pulse">▌</span>}
          </p>
        </div>

        {/* Варианты выбора */}
        {!isTyping && availableChoices.length > 0 && (
          <div className="space-y-2">
            {availableChoices.map((choice, index) => (
              <motion.button
                key={index}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleChoice(choice)}
                className="w-full text-left px-4 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:border-purple-500 rounded-lg text-slate-200 transition-all duration-200"
              >
                <span className="text-purple-400 mr-2">{index + 1}.</span>
                {choice.text}
                
                {/* Skill check indicator */}
                {choice.skillCheck && (
                  <span className="ml-2 text-xs text-amber-400">
                    [{choice.skillCheck.skill} {choice.skillCheck.difficulty}+]
                  </span>
                )}
              </motion.button>
            ))}
          </div>
        )}

        {/* Кнопка продолжить */}
        {!isTyping && availableChoices.length === 0 && !currentNode.autoNext && (
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-500 rounded-lg text-white transition-colors"
          >
            Закрыть
          </button>
        )}

        {/* Подсказка для продолжения */}
        {isTyping && (
          <div className="flex justify-between items-center">
            <p className="text-slate-500 text-sm">Нажмите для пропуска...</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                skipTyping();
              }}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-sm text-slate-300 transition-colors"
            >
              Пропустить ▶
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
});

// ============================================
// МЕНЕДЖЕР ДИАЛОГОВ
// ============================================

interface DialogueManagerProps {
  isOpen: boolean;
  npcId: string;
  npcName: string;
  dialogueTree: DialogueNode | null;
  onClose: () => void;
  playerState: PlayerState;
  npcRelations: NPCRelation[];
  flags: Record<string, boolean>;
  inventory: string[];
  visitedNodes: string[];
  onEffect: (effect: DialogueEffect) => void;
  onDialogueStart: (nodeId: string) => void;
}

export const DialogueManager = memo(function DialogueManager({
  isOpen,
  npcId,
  npcName,
  dialogueTree,
  onClose,
  playerState,
  npcRelations,
  flags,
  inventory,
  visitedNodes,
  onEffect,
  onDialogueStart,
}: DialogueManagerProps) {
  if (!isOpen || !dialogueTree) return null;

  return (
    <AnimatePresence>
      <DialogueWindow
        dialogueTree={dialogueTree}
        npcName={npcName}
        playerState={playerState}
        npcRelations={npcRelations}
        flags={flags}
        inventory={inventory}
        visitedNodes={visitedNodes}
        onClose={onClose}
        onEffect={onEffect}
        onStartDialogue={onDialogueStart}
      />
    </AnimatePresence>
  );
});

export default DialogueWindow;
