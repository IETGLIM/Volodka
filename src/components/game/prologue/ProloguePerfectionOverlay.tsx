/**
 * ProloguePerfectionOverlay — идеальное начало после "Начать с пролога".
 *
 * Было: fade 800ms -> black -> setCutscene('intro_wakeup') -> 29s камера летит, игрок просто смотрит.
 * Стало: 
 *  1. Menu dissolution с burn эффектом
 *  2. Boot console с typewriter + маскировка WASM загрузки (1.5MB streaming)
 *  3. Breath void + eye iris open (эмоция, а не техника)
 *  4. Title card "ПРОБУЖДЕНИЕ" с volumetric glow
 *  5. Handoff в существующий CinematicTimelineRunner (сохранена вся логика bed->stand->walk->sit)
 *
 * Оптимизация:
 * - Canvas смонтирован под оверлеем с opacity 0, первая кадра уже есть (CinematicTimelineRunner ждет canvas:first-frame)
 * - preloadPhysicsChunk + prefetchStoryNodes стартуют в boot фазе, прогресс показывается как kernel log
 * - Все скипается Esc / click, reduced-motion инстантом в handoff
 * - Использует performance marks из preloadPhysicsChunk.ts + gltfPipeline.ts
 */

import { useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { PrologueBootConsole } from './PrologueBootConsole';
import { PrologueBreathVoid } from './PrologueBreathVoid';
import { useProloguePerfection } from './useProloguePerfection';
import { CinematicTitleCard } from '@/components/game/cinematic/CinematicTitleCard';

interface Props {
  onComplete: () => void; // вызывает resetGame + setCutscene('intro_wakeup')
}

export function ProloguePerfectionOverlay({ onComplete }: Props) {
  const reducedMotion = useEffectiveReducedMotion();
  const { phase, progress, innerText, goNext, skipAll } = useProloguePerfection(onComplete);

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        skipAll();
      }
      if (e.key === ' ' || e.key === 'Enter') {
        if (phase === 'boot' || phase === 'breath') {
          // в boot — скип typewriter внутри компонентов, тут — next phase
          // оставляем логику внутри компонентов, этот хук только для Esc
        }
      }
    },
    [phase, skipAll],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  return (
    <motion.div
      className="fixed inset-0 z-[9999] bg-black overflow-hidden"
      style={{ zIndex: UI_LAYERS.LOADING + 10 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.6, ease: [0.16, 1, 0.3, 1] }}
      role="dialog"
      aria-modal="true"
      aria-label="Пролог — пробуждение"
    >
      {/* Ambient — матрица + пыль */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-[0.015] bg-[radial-gradient(ellipse_at_center,_rgba(0,255,180,0.35)_0%,transparent_70%)]" />
      </div>

      <AnimatePresence mode="wait">
        {phase === 'boot' && (
          <motion.div
            key="boot"
            initial={reducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, filter: 'blur(8px)', scale: 1.02 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0"
          >
            <PrologueBootConsole onComplete={goNext} loadingProgress={progress} />
          </motion.div>
        )}

        {phase === 'breath' && (
          <motion.div
            key="breath"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
          >
            <PrologueBreathVoid onComplete={goNext} innerText={innerText} />
          </motion.div>
        )}

        {phase === 'eyeOpen' && (
          <motion.div
            key="eyeOpen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black flex items-center justify-center"
          >
            {/* Тот же BreathVoid но форсит eye фазу — переиспользуем */}
            <PrologueBreathVoid onComplete={goNext} innerText={innerText} />
          </motion.div>
        )}

        {phase === 'title' && (
          <motion.div
            key="title"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05, filter: 'blur(12px)' }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 bg-black flex items-center justify-center"
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(0,255,255,0.08)_0%,rgba(0,0,0,1)_70%)]" aria-hidden />
            <CinematicTitleCard
              title="ПРОБУЖДЕНИЕ"
              subtitle="Комната 3×4. 06:47. Кофе холодный."
              accentColor="#44ffcc"
              type="act_transition"
              reducedMotion={reducedMotion}
            />
            {/* Subtle dust */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22300%22%3E%3Ccircle cx=%2250%22 cy=%2280%22 r=%221%22 fill=%22white%22/%3E%3Ccircle cx=%22120%22 cy=%22150%22 r=%220.8%22 fill=%22white%22/%3E%3Ccircle cx=%22200%22 cy=%2290%22 r=%221.2%22 fill=%22white%22/%3E%3C/svg%3E')] animate-pulse" />
          </motion.div>
        )}

        {phase === 'handoff' && (
          <motion.div
            key="handoff"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            className="absolute inset-0 bg-black"
            aria-hidden
          />
        )}
      </AnimatePresence>

      {/* Skip hint — всегда видим */}
      <motion.button
        type="button"
        onClick={skipAll}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        whileHover={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] tracking-[0.18em] uppercase text-stone-300/70 backdrop-blur-md"
      >
        Пропустить — Esc
      </motion.button>

      {/* Progress dots */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
        {(['boot', 'breath', 'eyeOpen', 'title'] as const).map((p) => {
          const idx = ['boot', 'breath', 'eyeOpen', 'title'].indexOf(phase);
          const curIdx = ['boot', 'breath', 'eyeOpen', 'title'].indexOf(p);
          const active = curIdx === idx;
          const done = curIdx < idx;
          return (
            <div
              key={p}
              className="h-[3px] rounded-full transition-all duration-500"
              style={{
                width: active ? 28 : 10,
                background: done ? 'rgba(255,255,255,0.5)' : active ? 'rgba(0,255,200,0.9)' : 'rgba(255,255,255,0.15)',
                boxShadow: active ? '0 0 8px rgba(0,255,200,0.5)' : undefined,
              }}
              aria-hidden
            />
          );
        })}
      </div>
    </motion.div>
  );
}
