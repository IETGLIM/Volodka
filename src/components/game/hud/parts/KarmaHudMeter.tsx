'use client';

/* ─── Volodka RPG – Karma HUD Meter ───
   Small karma indicator always visible during gameplay.
   Shows karma value, tier label, and flash effect on karma changes.
   Blue gradient (#3b82f6 → #6366f1), numeric display, 300ms smooth animation. */

import { memo, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { usePlayerKarma } from '@/store/selectors';
import { getKarmaTierLabel } from '@/shared/utils/karmaTier';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';

const KARMA_MIN = -100;
const KARMA_MAX = 100;

export const KarmaHudMeter = memo(function KarmaHudMeter() {
  const karma = usePlayerKarma();
  const prevKarmaRef = useRef(karma);
  const [flashClass, setFlashClass] = useState<string | null>(null);
  const [damageFlash, setDamageFlash] = useState(false);
  const reducedMotion = useEffectiveReducedMotion();

  // Karma mapped to 0–100 for display (karma range is -100 to +100)
  const displayValue = Math.round(((karma - KARMA_MIN) / (KARMA_MAX - KARMA_MIN)) * 100);

  useEffect(() => {
    if (prevKarmaRef.current === karma) return;
    const delta = karma - prevKarmaRef.current;
    prevKarmaRef.current = karma;
    if (delta === 0 || reducedMotion) return;

    const cls = delta > 0 ? 'karma-flash-positive' : 'karma-flash-negative';
    setFlashClass(cls);
    // Brief red flash when karma drops
    if (delta < 0) {
      setDamageFlash(true);
      const flashTimer = setTimeout(() => setDamageFlash(false), 300);
      return () => clearTimeout(flashTimer);
    }
    const timer = setTimeout(() => setFlashClass(null), 600);
    return () => clearTimeout(timer);
  }, [karma, reducedMotion]);

  const tierLabel = getKarmaTierLabel(karma);
  const color = karma >= 60
    ? 'var(--cyber-cyan, #00e5ff)'
    : karma <= 40
      ? '#fb7185'
      : '#fbbf24';

  return (
    <div
      className={`karma-hud-meter ${flashClass ?? ''}`}
      role="img"
      aria-label={`Карма: ${karma}, ${tierLabel}`}
      style={{ borderColor: `${color}40` }}
    >
      <span className="karma-label">K</span>
      {/* Animated karma bar with blue gradient */}
      <div
        className="relative h-1.5 w-16 bg-slate-800/60 rounded-full overflow-hidden"
        aria-hidden="true"
      >
        <motion.div
          className="h-full rounded-full"
          style={{
            background: 'linear-gradient(90deg, #3b82f6, #6366f1)',
            boxShadow: damageFlash
              ? '0 0 8px rgba(239, 68, 68, 0.6)'
              : '0 0 4px rgba(99, 102, 241, 0.3)',
          }}
          initial={false}
          animate={{ width: `${displayValue}%` }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        />
      </div>
      <span className="karma-value" style={{ color }}>
        {karma}
      </span>
      <span className="karma-label" style={{ color: `${color}90` }}>
        {tierLabel}
      </span>
    </div>
  );
});
