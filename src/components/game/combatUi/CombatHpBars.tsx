/* Animated cyber terminal HP bars for combat overlay. */

import React from 'react';
import { motion } from 'framer-motion';

export const AnimatedHPBar = React.memo(function AnimatedHPBar({
  current,
  max,
  label,
  isPlayer,
  ariaLabel,
}: {
  current: number;
  max: number;
  label: string;
  isPlayer: boolean;
  ariaLabel?: string;
}) {
  const pct = max > 0 ? Math.max(0, (current / max) * 100) : 0;
  const color = isPlayer
    ? pct > 60
      ? 'from-emerald-500 to-cyan-400'
      : pct > 30
        ? 'from-amber-500 to-yellow-400'
        : 'from-red-600 to-red-400'
    : pct > 60
      ? 'from-red-600 to-rose-400'
      : pct > 30
        ? 'from-orange-600 to-amber-400'
        : 'from-yellow-500 to-emerald-400';
  const glowColor = isPlayer
    ? pct > 60
      ? 'shadow-emerald-500/50'
      : pct > 30
        ? 'shadow-amber-500/50'
        : 'shadow-red-500/60'
    : pct > 60
      ? 'shadow-red-500/50'
      : pct > 30
        ? 'shadow-orange-500/50'
        : 'shadow-yellow-500/50';
  const glowHex = isPlayer
    ? pct > 60
      ? '#10b981'
      : pct > 30
        ? '#f59e0b'
        : '#ef4444'
    : pct > 60
      ? '#ef4444'
      : pct > 30
        ? '#f97316'
        : '#eab308';

  return (
    <div className={`flex flex-col ${isPlayer ? 'items-start' : 'items-end'} w-full`}>
      <div className="text-[10px] text-slate-400 mb-0.5 font-mono uppercase tracking-wider">{label}</div>
      <div
        role="progressbar"
        aria-valuenow={Math.max(0, current)}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={ariaLabel || (isPlayer ? 'Здоровье игрока' : 'Здоровье противника')}
        className="w-full h-3.5 bg-black/80 border border-slate-700/40 rounded-sm overflow-hidden relative"
      >
        <motion.div
          className={`h-full bg-gradient-to-r ${color} ${glowColor} shadow-sm rounded-sm`}
          style={{ boxShadow: `0 0 8px ${glowHex}40` }}
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-[9px] text-white font-mono font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
          {Math.max(0, current)} / {max}
        </div>
      </div>
    </div>
  );
});
