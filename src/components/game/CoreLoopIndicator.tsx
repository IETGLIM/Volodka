'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useCoreLoopPhase, type CoreLoopPhase } from '@/hooks/useCoreLoopPhase';

// ============================================
// ЦВЕТОВАЯ СХЕМА ФАЗ
// ============================================

const PHASE_COLORS: Record<CoreLoopPhase, {
  text: string;
  bg: string;
  border: string;
  glow: string;
  dot: string;
}> = {
  EXPLORING: {
    text: 'text-cyan-300',
    bg: 'bg-cyan-950/60',
    border: 'border-cyan-500/30',
    glow: 'shadow-cyan-500/20',
    dot: 'bg-cyan-400',
  },
  IN_DIALOGUE: {
    text: 'text-amber-300',
    bg: 'bg-amber-950/60',
    border: 'border-amber-500/30',
    glow: 'shadow-amber-500/20',
    dot: 'bg-amber-400',
  },
  MAKING_CHOICE: {
    text: 'text-purple-300',
    bg: 'bg-purple-950/60',
    border: 'border-purple-500/30',
    glow: 'shadow-purple-500/20',
    dot: 'bg-purple-400',
  },
  PROCESSING_CONSEQUENCES: {
    text: 'text-red-300',
    bg: 'bg-red-950/60',
    border: 'border-red-500/30',
    glow: 'shadow-red-500/20',
    dot: 'bg-red-400',
  },
  PROGRESSING: {
    text: 'text-green-300',
    bg: 'bg-green-950/60',
    border: 'border-green-500/30',
    glow: 'shadow-green-500/20',
    dot: 'bg-green-400',
  },
  NEW_OPPORTUNITIES: {
    text: 'text-emerald-300',
    bg: 'bg-emerald-950/60',
    border: 'border-emerald-500/30',
    glow: 'shadow-emerald-500/20',
    dot: 'bg-emerald-400',
  },
};

// ============================================
// ИКОНКИ ФАЗ (символьные)
// ============================================

const PHASE_ICONS: Record<CoreLoopPhase, string> = {
  EXPLORING: '◇',
  IN_DIALOGUE: '◈',
  MAKING_CHOICE: '◆',
  PROCESSING_CONSEQUENCES: '⚡',
  PROGRESSING: '▲',
  NEW_OPPORTUNITIES: '✦',
};

// ============================================
// КОМПОНЕНТ
// ============================================

export default function CoreLoopIndicator() {
  const { phase, phaseDisplayName } = useCoreLoopPhase();
  const colors = PHASE_COLORS[phase];
  const icon = PHASE_ICONS[phase];

  return (
    <div className="fixed top-4 right-4 z-40 pointer-events-none select-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={phase}
          initial={{ opacity: 0, y: -8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.95 }}
          transition={{
            duration: 0.3,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
          className={`
            flex items-center gap-2 px-3 py-1.5
            backdrop-blur-md border rounded-sm
            ${colors.bg} ${colors.border}
            shadow-lg ${colors.glow}
          `}
          style={{
            clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))',
          }}
        >
          {/* Пульсирующая точка */}
          <motion.span
            className={`w-1.5 h-1.5 rounded-full ${colors.dot}`}
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Иконка фазы */}
          <span className={`${colors.text} text-xs font-mono`}>
            {icon}
          </span>

          {/* Название фазы */}
          <span
            className={`${colors.text} text-[10px] font-mono tracking-widest uppercase`}
            style={{
              textShadow: `0 0 8px currentColor`,
            }}
          >
            {phaseDisplayName}
          </span>

          {/* Декоративная черта */}
          <motion.div
            className={`h-3 w-px ${colors.dot} opacity-40`}
            animate={{ opacity: [0.2, 0.6, 0.2] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
