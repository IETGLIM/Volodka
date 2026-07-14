import { memo } from 'react';
import { motion } from 'framer-motion';
import { buildStatChangeAnnouncement } from '@/engine/microAnimations/microAnimationsPresentation';

type StatChangeIndicatorProps = {
  statName: string;
  value: number;
  color?: string;
  x: number;
  y: number;
  reducedMotion: boolean;
};

export const StatChangeIndicator = memo(function StatChangeIndicator({
  statName,
  value,
  color,
  x,
  y,
  reducedMotion,
}: StatChangeIndicatorProps) {
  const isPositive = value > 0;
  const resolvedColor = color ?? (isPositive ? '#34d399' : '#f43f5e');
  const sign = isPositive ? '+' : '';
  const announcement = buildStatChangeAnnouncement(statName, value);

  return (
    <motion.div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      initial={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 0.8 }}
      animate={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -40, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reducedMotion ? 0.01 : 1.5, ease: 'easeOut' }}
      className={`absolute pointer-events-none select-none font-mono font-bold text-sm whitespace-nowrap stat-change-flash ${isPositive ? 'stat-change-flash-positive' : 'stat-change-flash-negative'}`}
      style={{
        left: x,
        top: y,
        color: resolvedColor,
        textShadow: `0 0 8px ${resolvedColor}60, 0 0 16px ${resolvedColor}30`,
      }}
    >
      <span className="sr-only">{announcement}</span>
      <span aria-hidden="true">
        {sign}
        {value} {statName}
      </span>
    </motion.div>
  );
});
