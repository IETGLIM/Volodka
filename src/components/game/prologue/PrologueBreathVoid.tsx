/**
 * Фаза дыхания — чернота + heartbeat + eye iris open.
 * ИСПРАВЛЕНО: единый источник истины — внешний хук управляет фазами,
 * внутренний state теперь только для анимации breath->eye, но строки всегда из props.
 * Глаза теперь тоже показывают innerText, а не заглушку.
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
  const [subPhase, setSubPhase] = useState<'breath' | 'eye'>('breath');

  useEffect(() => {
    if (reducedMotion) {
      onComplete();
      return;
    }
    const t1 = setTimeout(() => setSubPhase('eye'), PROLOGUE_PERFECTION.breathDurationMs);
    const t2 = setTimeout(onComplete, PROLOGUE_PERFECTION.breathDurationMs + PROLOGUE_PERFECTION.eyeOpenDurationMs);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [reducedMotion, onComplete]);

  return (
    <div className="relative h-full w-full bg-black overflow-hidden flex items-center justify-center">
      <motion.div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.1)_30%,rgba(0,0,0,0.92)_78%)]"
        animate={reducedMotion ? undefined : { scale: [1, 1.04, 1], opacity: [0.9, 1, 0.9] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden
      />

      <div className="absolute inset-0 pointer-events-none opacity-[0.04] mix-blend-soft-light" aria-hidden>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Cfilter id=%22f%22%3E%3CfeTurbulence baseFrequency=%220.8%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23f)%22/%3E%3C/svg%3E')]" />
      </div>

      <div className="relative z-10 max-w-2xl px-8 text-center">
        <AnimatePresence mode="wait">
          {subPhase === 'breath' ? (
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
              className="relative flex flex-col items-center gap-6"
            >
              <motion.div
                initial={{ clipPath: 'circle(0% at 50% 50%)' }}
                animate={{ clipPath: 'circle(68% at 50% 50%)' }}
                transition={{ duration: PROLOGUE_PERFECTION.eyeOpenDurationMs / 1000, ease: [0.16, 1, 0.3, 1] }}
                className="relative w-[88vw] max-w-[42rem] aspect-[16/9] rounded-[2px] overflow-hidden border border-white/10 bg-gradient-to-b from-stone-900/50 to-black/70 backdrop-blur-sm shadow-[0_16px_48px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.06)]"
              >
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(180,200,255,0.14)_0%,transparent_60%)]" />
                <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                <div className="relative z-10 flex flex-col items-center justify-center h-full p-6 gap-3">
                  <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35, duration: 0.8 }}
                    className="font-serif text-sm md:text-base leading-relaxed tracking-[0.06em] text-stone-200/85 text-center [text-shadow:0_1px_12px_rgba(0,0,0,0.7)]"
                  >
                    {innerText}
                  </motion.p>
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.45 }}
                    transition={{ delay: 0.7, duration: 0.6 }}
                    className="font-mono text-[9px] tracking-[0.32em] uppercase text-cyan-200/60 mt-2"
                  >
                    Глаза открываются • 06:47 • volodka://eye/iris open
                  </motion.span>
                </div>
                <div className="absolute inset-0 pointer-events-none opacity-[0.06] bg-[radial-gradient(ellipse_at_center,white_0.5px,transparent_1.5px)] bg-[length:18px_18px]" aria-hidden />
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 0.55, y: 0 }}
                transition={{ delay: 0.9, duration: 0.7 }}
                className="font-serif text-[11px] tracking-[0.18em] text-stone-500/60 max-w-md"
              >
                Свет режет. Пыль в луче. Где-то капает кран.
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {subPhase === 'eye' && !reducedMotion && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.14 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 pointer-events-none mix-blend-screen bg-[linear-gradient(90deg,rgba(255,0,80,0.08)_0%,transparent_8%,transparent_92%,rgba(0,255,255,0.08)_100%)]"
          aria-hidden
        />
      )}
    </div>
  );
}
