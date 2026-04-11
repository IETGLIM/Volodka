'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TimedChoiceProps {
  duration: number;           // Время в миллисекундах
  choices: Array<{
    text: string;
    effect?: () => void;
    isDefault?: boolean;      // Выбор по умолчанию при таймауте
  }>;
  onTimeout?: () => void;
  panicLevel?: 'warning' | 'critical' | 'panic';
}

export default function TimedChoice({ 
  duration, 
  choices, 
  onTimeout,
  panicLevel = 'warning' 
}: TimedChoiceProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [selected, setSelected] = useState<number | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  
  const progress = (timeLeft / duration) * 100;
  
  // Цвета в зависимости от уровня паники
  const colors = {
    warning: {
      bar: 'bg-amber-500',
      glow: 'shadow-amber-500/50',
      border: 'border-amber-500',
      text: 'text-amber-400',
      bg: 'bg-amber-500/10'
    },
    critical: {
      bar: 'bg-orange-500',
      glow: 'shadow-orange-500/50',
      border: 'border-orange-500',
      text: 'text-orange-400',
      bg: 'bg-orange-500/10'
    },
    panic: {
      bar: 'bg-red-500',
      glow: 'shadow-red-500/50',
      border: 'border-red-500',
      text: 'text-red-400',
      bg: 'bg-red-500/10'
    }
  };
  
  const currentColors = colors[panicLevel];
  
  // Таймер
  useEffect(() => {
    if (selected !== null || timedOut) return;
    
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, duration - elapsed);
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        clearInterval(interval);
        setTimedOut(true);
        
        // Находим выбор по умолчанию
        const defaultChoice = choices.find(c => c.isDefault) || choices[choices.length - 1];
        defaultChoice.effect?.();
        onTimeout?.();
      }
    }, 50);
    
    return () => clearInterval(interval);
  }, [duration, choices, selected, timedOut, onTimeout]);
  
  const handleChoice = useCallback((index: number, effect?: () => void) => {
    if (selected !== null || timedOut) return;
    setSelected(index);
    effect?.();
  }, [selected, timedOut]);
  
  // Глитч-эффект при низком времени
  const showGlitch = progress < 30;
  
  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Заголовок */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`text-center mb-4 ${currentColors.text}`}
      >
        <span className="text-sm uppercase tracking-widest font-mono">
          {panicLevel === 'panic' ? '🔥 KERNEL PANIC' : 
           panicLevel === 'critical' ? '⚠️ CRITICAL DECISION' : 
           '⏱️ ВРЕМЯ ОГРАНИЧЕНО'}
        </span>
      </motion.div>
      
      {/* Таймер-бар */}
      <div className={`h-3 w-full bg-gray-900/80 mb-6 rounded-full overflow-hidden border ${currentColors.border} shadow-lg ${currentColors.glow}`}>
        <motion.div 
          className={`h-full ${currentColors.bar} transition-all duration-100`}
          style={{ width: `${progress}%` }}
          animate={showGlitch ? {
            opacity: [1, 0.7, 1, 0.8, 1],
            x: [0, -2, 1, -1, 0]
          } : {}}
          transition={{
            duration: 0.2,
            repeat: showGlitch ? Infinity : 0
          }}
        />
      </div>
      
      {/* Секундомер */}
      <motion.div
        className={`text-center mb-6 font-mono text-2xl ${currentColors.text}`}
        animate={showGlitch ? { scale: [1, 1.02, 1, 0.98, 1] } : {}}
        transition={{ duration: 0.15, repeat: showGlitch ? Infinity : 0 }}
      >
        {(timeLeft / 1000).toFixed(1)}s
      </motion.div>
      
      {/* Варианты выбора */}
      <div className="space-y-3">
        <AnimatePresence>
          {choices.map((choice, index) => (
            <motion.button
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleChoice(index, choice.effect)}
              disabled={selected !== null || timedOut}
              className={`
                w-full text-left px-5 py-4 rounded-lg border
                transition-all duration-200 font-medium
                ${selected === index 
                  ? `bg-cyan-600/90 border-cyan-400 text-white scale-[1.02]` 
                  : timedOut && choice.isDefault
                  ? `bg-red-600/80 border-red-400 text-white`
                  : selected !== null
                  ? 'opacity-30 pointer-events-none'
                  : `${currentColors.bg} ${currentColors.border} hover:border-cyan-400 hover:bg-slate-700/50`
                }
                ${showGlitch ? 'animate-pulse' : ''}
              `}
            >
              <div className="flex items-center justify-between">
                <span>{choice.text}</span>
                {choice.isDefault && (
                  <span className="text-xs opacity-60">авто</span>
                )}
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
      
      {/* Сообщение о таймауте */}
      <AnimatePresence>
        {timedOut && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-4 text-center ${currentColors.text} text-sm`}
          >
            ⚡ Время вышло. Автоматический выбор.
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Глитч-оверлей */}
      {showGlitch && (
        <motion.div
          className="fixed inset-0 pointer-events-none z-40"
          animate={{
            opacity: [0, 0.1, 0, 0.05, 0],
            background: [
              'transparent',
              'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,0,0,0.1) 2px, rgba(255,0,0,0.1) 4px)',
              'transparent'
            ]
          }}
          transition={{ duration: 0.3, repeat: Infinity }}
        />
      )}
    </div>
  );
}
