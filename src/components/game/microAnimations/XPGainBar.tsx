import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { buildXpGainAnnouncement } from '@/engine/microAnimations/microAnimationsPresentation';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';

export type XPGainBarProps = {
  currentXP: number;
  xpToNext: number;
  previousXP: number;
};

export function XPGainBar({ currentXP, xpToNext, previousXP }: XPGainBarProps) {
  const reducedMotion = useEffectiveReducedMotion();
  const [showGain, setShowGain] = useState(false);
  const [gainAmount, setGainAmount] = useState(0);
  const prevXPRef = useRef(previousXP);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (currentXP > prevXPRef.current) {
      const delta = currentXP - prevXPRef.current;
      setGainAmount(delta);
      setShowGain(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setShowGain(false), reducedMotion ? 800 : 2000);
      prevXPRef.current = currentXP;
    } else {
      prevXPRef.current = currentXP;
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentXP, reducedMotion]);

  const pct = Math.min(100, (currentXP / xpToNext) * 100);

  return (
    <div className="relative" role="group" aria-label="Полоса опыта">
      <div className="h-2 bg-slate-800/80 rounded-full overflow-hidden relative data-bar">
        <motion.div
          className="h-full rounded-full data-bar-fill"
          style={{
            background: 'linear-gradient(90deg, #0891b2, var(--cyber-cyan))',
            boxShadow: '0 0 8px rgb(var(--cyber-cyan-rgb) / 0.3), inset 0 1px 0 rgba(255,255,255,0.15)',
          }}
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: reducedMotion ? 0 : 0.8, ease: [0.4, 0, 0.2, 1] }}
        />
        {!reducedMotion ? (
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full overflow-hidden"
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          >
            <motion.div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)' }}
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 4, ease: 'linear' }}
            />
          </motion.div>
        ) : null}
      </div>

      <AnimatePresence>
        {showGain && gainAmount > 0 ? (
          <motion.div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: -4 }}
            animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: -12 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: reducedMotion ? 0.01 : 1.8, ease: 'easeOut' }}
            className="absolute -top-1 left-1/2 -translate-x-1/2 text-xs font-bold font-mono text-cyan-400 whitespace-nowrap"
            style={{ textShadow: '0 0 8px rgb(var(--cyber-cyan-rgb) / 0.6)' }}
          >
            <span className="sr-only">{buildXpGainAnnouncement(gainAmount)}</span>
            <span aria-hidden="true">+{gainAmount} XP</span>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="flex justify-between mt-0.5">
        <span className="text-[9px] text-slate-400 font-mono data-bar-label">{currentXP}</span>
        <span className="text-[9px] text-slate-400 font-mono data-bar-label">{xpToNext} XP</span>
      </div>
    </div>
  );
}
