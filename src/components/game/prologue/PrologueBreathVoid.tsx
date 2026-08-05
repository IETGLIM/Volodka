/**
 * Фаза дыхания — чернота + heartbeat + eye iris open.
 * Оптимизация: в это время canvas уже смонтирован с opacity 0, первый кадр уже есть.
 * Красота: дыхание vignette + текст внутреннего монолога + шум города за окном.
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { PROLOGUE_PERFECTION } from './prologuePerfectionConstants';

interface Props {
  onComplete: () => void;
  innerText: string;
}

export function PrologueBreathVoid({ onComplete, innerText }: Props) {
  const reducedMotion = useEffectiveReducedMotion();
  const [phase, setPhase] = useState<'breath' | 'eye'>('breath');

  useEffect(() => {
    if (reducedMotion) {
      onComplete();
      return;
    }
    const t1 = setTimeout(() => setPhase('eye'), PROLOGUE_PERFECTION.breathDurationMs);
    const t2 = setTimeout(onComplete, PROLOGUE_PERFECTION.breathDurationMs + PROLOGUE_PERFECTION.eyeOpenDurationMs);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [reducedMotion, onComplete]);

  return (
    <div className="relative h-full w-full bg-black overflow-hidden flex items-center justify-center">
      {/* Дышащая виньетка */}
      <motion.div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.1)_30%,rgba(0,0,0,0.92)_78%)]"
        animate={reducedMotion ? undefined : { scale: [1, 1.04, 1], opacity: [0.9, 1, 0.9] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden
      />

      {/* Шум за окном — далекий трамвай, дождь */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.04] mix-blend-soft-light" aria-hidden>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Cfilter id=%22f%22%3E%3CfeTurbulence baseFrequency=%220.8%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23f)%22/%3E%3C/svg%3E')]" />
      </div>

      <div className="relative z-10 max-w-2xl px-8 text-center">
        <AnimatePresence mode="wait">
          {phase === 'breath' ? (
            <motion.div
              key="breath"
              initial={{ opacity: 0, y: 12, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -10, filter: 'blur(6px)' }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="w-12 h-px mx-auto mb-6 bg-gradient-to-r from-transparent via-cyan-200/30 to-transparent" />
              <p className="font-serif text-lg md:text-xl leading-relaxed tracking-[0.08em] text-stone-200/90 [text-shadow:0_0_24px_rgba(0,255,255,0.15)]">
                {innerText}
              </p>
              <div className="w-12 h-px mx-auto mt-6 bg-gradient-to-r from-transparent via-amber-200/20 to-transparent" />

              {/* Heartbeat dot */}
              <motion.div
                className="mt-8 mx-auto w-1 h-1 rounded-full bg-amber-200/60"
                animate={{ scale: [1, 2.2, 1], opacity: [0.6, 0.15, 0.6] }}
                transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
                aria-hidden
              />
            </motion.div>
          ) : (
            <motion.div
              key="eye"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative"
            >
              {/* Iris open effect */}
              <motion.div
                initial={{ clipPath: 'circle(0% at 50% 50%)' }}
                animate={{ clipPath: 'circle(65% at 50% 50%)' }}
                transition={{ duration: PROLOGUE_PERFECTION.eyeOpenDurationMs / 1000, ease: [0.16, 1, 0.3, 1] }}
                className="relative"
              >
                <div className="w-[88vw] max-w-[42rem] aspect-[16/9] mx-auto rounded-[2px] overflow-hidden border border-white/10 bg-gradient-to-b from-stone-900/40 to-black/60 backdrop-blur-sm">
                  {/* Тут будет первый кадр спальни, но пока заглушка с эмбиентом */}
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(180,200,255,0.12)_0%,transparent_60%)]" />
                  <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                  <div className="flex items-center justify-center h-full">
                    <span className="font-serif text-[10px] tracking-[0.32em] uppercase text-stone-500/40">
                      Глаза открываются...
                    </span>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Subtle chromatic aberration on eye open */}
      {phase === 'eye' && !reducedMotion && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.12 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 pointer-events-none mix-blend-screen bg-[linear-gradient(90deg,rgba(255,0,80,0.08)_0%,transparent_8%,transparent_92%,rgba(0,255,255,0.08)_100%)]"
          aria-hidden
        />
      )}
    </div>
  );
}
