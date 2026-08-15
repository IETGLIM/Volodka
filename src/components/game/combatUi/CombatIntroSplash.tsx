import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { UI_LAYERS } from '@/shared/constants/uiLayers';

/** Combat intro splash (first ~1.5s of each fight). */
export function CombatIntroSplash({
  emoji,
  name,
  isBoss = false,
  onDone,
}: {
  emoji: string;
  name: string;
  isBoss?: boolean;
  onDone: () => void;
}) {
  useEffect(() => {
    // Bosses get a longer, more dramatic intro.
    const timer = setTimeout(onDone, isBoss ? 2400 : 1550);
    return () => clearTimeout(timer);
  }, [onDone, isBoss]);

  return (
    <motion.div
      className={`combat-intro-overlay ${isBoss ? 'combat-intro-overlay--boss' : ''}`}
      style={{ zIndex: UI_LAYERS.COMBAT + 3 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <div className={`combat-intro-card ${isBoss ? 'combat-intro-card--boss' : ''}`}>
        <div className="combat-intro-slash" aria-hidden />
        {isBoss && (
          <div
            className="text-[11px] font-mono tracking-[0.5em] uppercase mb-1"
            style={{ color: '#ff4a4a', textShadow: '0 0 12px rgba(255,74,74,0.8)' }}
          >
            ⚠ БОСС ⚠
          </div>
        )}
        <div
          className={`combat-intro-emoji mb-2 enemy-hologram ${isBoss ? 'combat-intro-emoji--boss' : ''}`}
          style={isBoss ? { fontSize: '5rem', filter: 'drop-shadow(0 0 24px rgba(255,74,74,0.6))' } : undefined}
        >
          {emoji}
        </div>
        <div className={`gradient-text-rose combat-intro-title mb-2 ${isBoss ? 'combat-intro-title--boss' : ''}`}>
          {isBoss ? 'РЕШАЮЩАЯ БИТВА' : 'БОЙ'}
        </div>
        <div className={`text-sm text-red-200/90 font-mono tracking-widest uppercase ${isBoss ? 'text-base' : ''}`}>
          {name}
        </div>
        {!isBoss && (
          <div className="text-[10px] text-slate-500 font-mono mt-3 tracking-wide">
            1 атака · 2 защита · 3 стих · 4 побег
          </div>
        )}
        {isBoss && (
          <div className="text-[10px] text-rose-400/80 font-mono mt-3 tracking-wide">
            Побег невозможен · исход решает судьбу
          </div>
        )}
      </div>
    </motion.div>
  );
}
