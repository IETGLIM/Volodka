"use client";

import { memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { StoryNode, StoryChoice, StoryEffect } from '@/data/types';

// ============================================
// ПАНЕЛЬ ИСТОРИИ
// ============================================

interface StoryPanelProps {
  node: StoryNode;
  displayedText: string;
  isTyping: boolean;
  showChoices: boolean;
  onChoice: (choice: StoryChoice) => void;
  onContinue: () => void;
}

export const StoryPanel = memo(function StoryPanel({
  node,
  displayedText,
  isTyping,
  showChoices,
  onChoice,
  onContinue,
}: StoryPanelProps) {
  // Проверка доступности выбора
  const isChoiceAvailable = useMemo(() => (choice: StoryChoice) => {
    if (choice.locked) return false;
    // Можно добавить проверки условий
    return true;
  }, []);

  // Форматирование эффекта выбора
  const formatEffect = useMemo(() => (effect?: StoryEffect) => {
    if (!effect) return null;
    
    const parts: string[] = [];
    if (effect.mood) parts.push(`😊 ${effect.mood > 0 ? '+' : ''}${effect.mood}`);
    if (effect.creativity) parts.push(`🎨 ${effect.creativity > 0 ? '+' : ''}${effect.creativity}`);
    if (effect.stability) parts.push(`🧠 ${effect.stability > 0 ? '+' : ''}${effect.stability}`);
    if (effect.karma) parts.push(`✨ ${effect.karma > 0 ? '+' : ''}${effect.karma}`);
    if (effect.stress) parts.push(`💢 ${effect.stress > 0 ? '+' : ''}${effect.stress}`);
    
    return parts.length > 0 ? parts.join(' ') : null;
  }, []);

  return (
    <div className="absolute bottom-0 left-0 right-0 z-20">
      {/* Градиент для читаемости */}
      <div className="h-24 bg-gradient-to-t from-black/80 via-black/60 to-transparent pointer-events-none" />
      
      <div className="bg-slate-900/90 backdrop-blur-md border-t border-slate-700/50 p-4 md:p-6">
        {/* Спикер */}
        <AnimatePresence>
          {node.speaker && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-2"
            >
              <span 
                className="text-purple-400 text-sm font-medium px-2 py-0.5 bg-purple-500/20 rounded"
                style={{ textShadow: '0 0 10px rgba(139, 92, 246, 0.3)' }}
              >
                {node.speaker}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Текст */}
        <div className="text-white text-base md:text-lg leading-relaxed mb-4 min-h-[60px] whitespace-pre-line">
          {displayedText}
          {isTyping && (
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="text-purple-400"
            >
              ▮
            </motion.span>
          )}
        </div>
        
        {/* Выборы */}
        <AnimatePresence>
          {showChoices && node.choices && !isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="space-y-2"
            >
              {node.choices.map((choice, i) => {
                const available = isChoiceAvailable(choice);
                const effectText = formatEffect(choice.effect);
                
                return (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    onClick={() => available && onChoice(choice)}
                    disabled={!available}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-all text-sm md:text-base ${
                      available 
                        ? 'bg-slate-700/80 hover:bg-slate-600/90 text-white hover:shadow-lg hover:shadow-purple-500/20 border border-slate-600/50 hover:border-purple-400/50' 
                        : 'bg-slate-800/50 text-slate-500 cursor-not-allowed border border-slate-700/30'
                    }`}
                  >
                    <div className="flex justify-between items-center gap-4">
                      <span className={available ? '' : 'line-through opacity-50'}>
                        {choice.text}
                      </span>
                      {effectText && (
                        <span className="text-xs text-slate-400 flex-shrink-0">
                          {effectText}
                        </span>
                      )}
                    </div>
                    {choice.locked && choice.lockReason && (
                      <span className="text-xs text-red-400 mt-1 block">
                        🔒 {choice.lockReason}
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Продолжить */}
        <AnimatePresence>
          {!showChoices && !isTyping && node.autoNext && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <motion.button
                onClick={onContinue}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-purple-400 text-sm hover:text-purple-300 transition-colors"
              >
                ▼ Нажмите чтобы продолжить
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Концовка */}
        <AnimatePresence>
          {node.type === 'ending' && !isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-4"
            >
              <div className="text-purple-300 text-xl mb-2">— Конец —</div>
              <div className="text-slate-400 text-sm">Спасибо за игру</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});

export default StoryPanel;
