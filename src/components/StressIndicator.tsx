'use client';

import { memo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface StressIndicatorProps {
  stress: number;
  panicMode: boolean;
  resilience: number;
}

const StressIndicator = memo(function StressIndicator({ stress, panicMode, resilience }: StressIndicatorProps) {
  const [glitchActive, setGlitchActive] = useState(false);
  
  // Эффект глитча при высоком стрессе
  useEffect(() => {
    if (stress > 70) {
      const interval = setInterval(() => {
        setGlitchActive(true);
        setTimeout(() => setGlitchActive(false), 100);
      }, 2000 - stress * 15);
      return () => clearInterval(interval);
    }
  }, [stress]);

  // Определение уровня опасности
  const getLevel = () => {
    if (panicMode) return 'panic';
    if (stress >= 80) return 'critical';
    if (stress >= 50) return 'warning';
    return 'normal';
  };

  const level = getLevel();

  const colors = {
    normal: {
      bg: 'bg-slate-700',
      bar: 'bg-emerald-500',
      glow: '',
      text: 'text-emerald-400'
    },
    warning: {
      bg: 'bg-slate-700',
      bar: 'bg-amber-500',
      glow: 'shadow-amber-500/50',
      text: 'text-amber-400'
    },
    critical: {
      bg: 'bg-slate-700',
      bar: 'bg-orange-500',
      glow: 'shadow-orange-500/50',
      text: 'text-orange-400'
    },
    panic: {
      bg: 'bg-slate-700',
      bar: 'bg-red-500',
      glow: 'shadow-red-500/50',
      text: 'text-red-400'
    }
  };

  const currentColors = colors[level];

  return (
    <div className="flex items-center gap-2">
      {/* Иконка */}
      <motion.div
        animate={panicMode ? { scale: [1, 1.2, 1] } : {}}
        transition={{ duration: 0.5, repeat: panicMode ? Infinity : 0 }}
        className={`text-sm ${panicMode ? 'text-red-400' : stress > 50 ? 'text-amber-400' : 'text-slate-400'}`}
      >
        {panicMode ? '🔥' : stress > 70 ? '⚠️' : stress > 40 ? '😰' : '😌'}
      </motion.div>

      {/* Бар стресса */}
      <div className="relative w-24 h-2">
        <div className={`absolute inset-0 ${currentColors.bg} rounded-full`} />
        
        <motion.div
          initial={{ width: 0 }}
          animate={{ 
            width: `${stress}%`,
            x: glitchActive ? [-2, 2, -1, 1, 0] : 0
          }}
          transition={{ 
            width: { duration: 0.3 },
            x: { duration: 0.1 }
          }}
          className={`absolute inset-y-0 left-0 ${currentColors.bar} rounded-full shadow-lg ${currentColors.glow}`}
        />

        {/* Глитч-линии при критическом уровне */}
        {stress > 80 && (
          <motion.div
            className="absolute inset-0 overflow-hidden rounded-full"
            animate={{ opacity: [0, 0.5, 0] }}
            transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 1 }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              style={{ width: '30%' }}
              animate={{ x: ['-100%', '350%'] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
            />
          </motion.div>
        )}
      </div>

      {/* Значение */}
      <motion.span
        animate={panicMode ? { 
          color: ['#f87171', '#fbbf24', '#f87171'],
          scale: [1, 1.05, 1]
        } : {}}
        transition={{ duration: 0.5, repeat: panicMode ? Infinity : 0 }}
        className={`text-xs font-mono ${currentColors.text}`}
      >
        {stress}%
      </motion.span>

      {/* Защита от стресса */}
      {resilience > 20 && (
        <div className="flex items-center gap-0.5 ml-1" title={`Стрессоустойчивость: ${resilience}`}>
          <span className="text-xs">🛡️</span>
          <span className="text-xs text-emerald-400">-{Math.floor(resilience / 10)}%</span>
        </div>
      )}
    </div>
  );
});

// Полноэкранный оверлей Kernel Panic
export const KernelPanicOverlay = memo(function KernelPanicOverlay({ 
  isActive,
  onCalmDown 
}: { 
  isActive: boolean;
  onCalmDown: () => void;
}) {
  const [glitchText, setGlitchText] = useState('ПАНИКА ЯДРА');

  useEffect(() => {
    if (!isActive) return;

    const messages = [
      'ПАНИКА ЯДРА',
      'ПАМЯТЬ ПЕРЕПОЛНЕНА',
      'СИСТЕМА НЕСТАБИЛЬНА',
      'ТРЕБУЕТСЯ ПЕРЕЗАГРУЗКА',
      'ОШИБКА: ЭМОЦИОНАЛЬНЫЙ СБОЙ',
      'УТЕЧКА ПАМЯТИ',
    ];

    const interval = setInterval(() => {
      setGlitchText(messages[Math.floor(Math.random() * messages.length)]);
    }, 500);

    return () => clearInterval(interval);
  }, [isActive]);

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center overflow-hidden"
        >
          {/* Глитч-линии */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(10)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-full h-px bg-red-500/50"
                style={{ top: `${10 + i * 10}%` }}
                animate={{
                  opacity: [0, 1, 0],
                  x: [-100, 100],
                  scaleX: [1, 1.5, 1]
                }}
                transition={{
                  duration: 0.5,
                  delay: i * 0.1,
                  repeat: Infinity,
                  repeatDelay: Math.random() * 2
                }}
              />
            ))}
          </div>

          {/* Сообщение */}
          <motion.div
            animate={{
              x: [0, -5, 5, -3, 3, 0],
              textShadow: [
                '0 0 10px #f00',
                '0 0 20px #f00, 0 0 30px #f00',
                '0 0 10px #f00'
              ]
            }}
            transition={{ duration: 0.2, repeat: Infinity }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-6xl font-mono font-bold text-red-500 mb-4">
              {glitchText.split('').map((char, i) => (
                <motion.span
                  key={i}
                  animate={{
                    y: Math.random() > 0.8 ? [0, -5, 5, 0] : 0,
                    color: Math.random() > 0.9 ? '#ff0' : '#f00'
                  }}
                  transition={{ duration: 0.1, delay: i * 0.02 }}
                >
                  {char}
                </motion.span>
              ))}
            </h1>
            <p className="text-red-400/80 font-mono text-sm md:text-base">
              Система перегружена. Требуется действие.
            </p>
          </motion.div>

          {/* Кнопка успокоения */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            onClick={onCalmDown}
            className="mt-8 px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-lg font-semibold rounded-xl transition-all shadow-lg shadow-cyan-500/30"
          >
            🧘 Глубокий вдох... (сброс стресса)
          </motion.button>

          {/* Бинарный код на фоне */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10 font-mono text-green-500 text-xs">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                style={{ left: `${i * 5}%` }}
                animate={{ y: [-100, window.innerHeight + 100] }}
                transition={{ duration: 5 + i * 0.5, repeat: Infinity, ease: 'linear' }}
              >
                {[...Array(30)].map((_, j) => (
                  <div key={j}>{Math.random() > 0.5 ? '1' : '0'}</div>
                ))}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export default StressIndicator;
