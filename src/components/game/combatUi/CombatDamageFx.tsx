/* Floating damage numbers, combo counter, and hit-flash overlay. */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame } from 'lucide-react';
import { UI_LAYERS } from '@/shared/constants/uiLayers';

export const DamageNumber = React.memo(function DamageNumber({
  damage,
  type,
  isCritical,
}: {
  damage: number;
  type: string;
  isCritical?: boolean;
}) {
  const isHeal = type === 'player_power' && damage > 0;
  const isPoemCombo = type === 'poem_combo';
  const color =
    type === 'enemy_attack' || type === 'enemy_special'
      ? 'text-red-400'
      : isPoemCombo
        ? 'text-fuchsia-400'
        : isHeal
          ? 'text-emerald-400'
          : isCritical
            ? 'text-yellow-300'
            : 'text-cyan-300';
  const size = isCritical ? 'text-4xl' : isPoemCombo ? 'text-3xl' : 'text-2xl';

  return (
    <motion.div
      initial={{ opacity: 1, y: 0, scale: isCritical ? 1.45 : 0.8, rotate: isCritical ? -4 : 0 }}
      animate={{ opacity: 0, y: -68, scale: isCritical ? 1.95 : 1.1, rotate: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: isCritical ? 1.85 : 1.2, ease: [0.2, 0, 0.3, 1] }}
      className={`absolute ${size} font-bold ${color} pointer-events-none select-none text-glow-pulse ${isCritical ? 'glitch-skew' : ''}`}
      style={{
        zIndex: UI_LAYERS.COMBAT,
        textShadow: `0 0 ${isCritical ? 18 : 8}px currentColor, 0 2px 4px rgba(0,0,0,0.8)`,
        letterSpacing: isCritical ? '0.04em' : undefined,
      }}
    >
      {isHeal ? '+' : '-'}
      {damage}
      {isCritical && (
        <span className="ml-1 text-sm font-mono tracking-widest text-yellow-200/90">КРИТ</span>
      )}
    </motion.div>
  );
});

export function ComboCounter({ count }: { count: number }) {
  if (count < 1) return null;
  const multiplier = count >= 3 ? 2.0 : count >= 2 ? 1.5 : 1.2;
  const intensity = Math.min(count, 5);
  const colors = [
    'text-cyan-400',
    'text-cyan-300',
    'text-amber-400',
    'text-orange-400',
    'text-red-400',
    'text-fuchsia-400',
  ];
  const color = colors[Math.min(count, colors.length - 1)];

  return (
    <motion.div
      key={count}
      initial={{ scale: 1.6, opacity: 0.8 }}
      animate={{ scale: 1, opacity: 1 }}
      className="flex flex-col items-center"
    >
      <div
        className={`text-3xl font-black ${color} font-mono`}
        style={{
          textShadow: `0 0 ${8 + intensity * 4}px currentColor, 0 0 ${16 + intensity * 8}px ${count >= 3 ? '#f97316' : '#06b6d4'}40`,
        }}
      >
        <Flame className="inline size-5 mr-0.5" />
        x{count}
      </div>
      <div className="text-[9px] text-slate-400 font-mono">×{multiplier} УРОН</div>
      {count >= 3 && (
        <motion.div
          className="text-[8px] text-orange-400 font-mono mt-0.5"
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        >
          🔥 МАКСИМАЛЬНЫЙ КОМБО!
        </motion.div>
      )}
    </motion.div>
  );
}

export function CombatScreenFlash({ flashColor }: { flashColor: string | null }) {
  return (
    <AnimatePresence mode="wait">
      {flashColor && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 pointer-events-none"
          style={{ backgroundColor: flashColor, zIndex: UI_LAYERS.COMBAT + 1 }}
        />
      )}
    </AnimatePresence>
  );
}
