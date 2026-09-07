/* Combo counter and hit-flash overlay.
 * v4.15.3: DamageNumber удалён — числа урона рендерит единый пуловый
 * damageNumberLayer (WAAPI transform-only, аудит-этап 28): раньше
 * хит рисовался тремя слоями одновременно. */

import { motion, AnimatePresence } from 'framer-motion';
import { Flame } from 'lucide-react';
import { UI_LAYERS } from '@/shared/constants/uiLayers';

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
