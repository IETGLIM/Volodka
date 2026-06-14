import { memo } from 'react';
import { motion } from 'framer-motion';
import {
  buildKarmaShiftAnnouncement,
  buildKarmaShiftLabel,
} from '@/engine/microAnimations/microAnimationsPresentation';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';

export type KarmaShiftIndicatorProps = {
  delta: number;
  currentKarma: number;
};

export const KarmaShiftIndicator = memo(function KarmaShiftIndicator({
  delta,
  currentKarma,
}: KarmaShiftIndicatorProps) {
  const reducedMotion = useEffectiveReducedMotion();
  const isPositive = delta > 0;
  const color = isPositive ? 'var(--cyber-cyan)' : '#fb7185';
  const label = buildKarmaShiftLabel(delta, currentKarma);
  const announcement = buildKarmaShiftAnnouncement(delta, currentKarma);

  return (
    <motion.div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      initial={reducedMotion ? { opacity: 1 } : { opacity: 1, scale: 0.7 }}
      animate={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 1.2, y: -30 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reducedMotion ? 0.01 : 2, ease: 'easeOut' }}
      className="flex items-center gap-1.5 pointer-events-none select-none"
      style={{ color, textShadow: `0 0 10px ${color}60` }}
    >
      <span className="sr-only">{announcement}</span>
      <span className="text-lg" aria-hidden="true">
        ☯
      </span>
      <span className="font-mono font-bold text-sm" aria-hidden="true">
        {isPositive ? '+' : ''}
        {delta}
      </span>
      <span className="text-xs opacity-80" aria-hidden="true">
        {label}
      </span>
    </motion.div>
  );
});
