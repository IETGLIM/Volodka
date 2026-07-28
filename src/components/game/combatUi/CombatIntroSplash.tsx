import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { UI_LAYERS } from '@/shared/constants/uiLayers';

/** Combat intro splash (first ~1.5s of each fight). */
export function CombatIntroSplash({
  emoji,
  name,
  onDone,
}: {
  emoji: string;
  name: string;
  onDone: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onDone, 1550);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <motion.div
      className="combat-intro-overlay"
      style={{ zIndex: UI_LAYERS.COMBAT + 3 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <div className="combat-intro-card">
        <div className="combat-intro-slash" aria-hidden />
        <div className="combat-intro-emoji mb-2 enemy-hologram">{emoji}</div>
        <div className="combat-intro-title mb-2">БОЙ</div>
        <div className="text-sm text-red-200/90 font-mono tracking-widest uppercase">{name}</div>
        <div className="text-[10px] text-slate-500 font-mono mt-3 tracking-wide">
          1 атака · 2 защита · 3 стих · 4 побег
        </div>
      </div>
    </motion.div>
  );
}
