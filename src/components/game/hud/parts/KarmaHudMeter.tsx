'use client';

/* ─── Volodka RPG – Karma HUD Meter ───
   Small karma indicator always visible during gameplay.
   Shows karma value, tier label, and flash effect on karma changes. */

import { memo, useEffect, useRef, useState } from 'react';
import { usePlayerKarma } from '@/store/selectors';
import { getKarmaTierLabel } from '@/shared/utils/karmaTier';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';

export const KarmaHudMeter = memo(function KarmaHudMeter() {
  const karma = usePlayerKarma();
  const prevKarmaRef = useRef(karma);
  const [flashClass, setFlashClass] = useState<string | null>(null);
  const reducedMotion = useEffectiveReducedMotion();

  useEffect(() => {
    if (prevKarmaRef.current === karma) return;
    const delta = karma - prevKarmaRef.current;
    prevKarmaRef.current = karma;
    if (delta === 0 || reducedMotion) return;

    const cls = delta > 0 ? 'karma-flash-positive' : 'karma-flash-negative';
    setFlashClass(cls);
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
      <span className="karma-value" style={{ color }}>
        {karma}
      </span>
      <span className="karma-label" style={{ color: `${color}90` }}>
        {tierLabel}
      </span>
    </div>
  );
});
