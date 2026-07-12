
/* ─── Volodka RPG – Karma/moral compass HUD */

import { motion, useMotionValue, animate } from 'framer-motion';
import { usePlayerKarma } from '@/store/selectors';
import { KARMA_LOW_THRESHOLD, KARMA_HIGH_THRESHOLD } from '@/data/constants';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { getKarmaTierLabel } from '@/shared/utils/karmaTier';
import { bottomMoralCompassPx, bottomRightInsetPx } from '@/shared/constants/hudLayout';
import { useHudQuietStyle } from '@/hooks/useHudQuiet';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { useEffect, useRef } from 'react';

export function MoralCompassHUD() {
  const karma = usePlayerKarma();
  const quietStyle = useHudQuietStyle();
  const reducedMotion = useEffectiveReducedMotion();

  // Pulse animation via motion value
  const pulseScale = useMotionValue(1);
  const pulseOpacity = useMotionValue(0);
  const prevKarmaRef = useRef(karma);

  useEffect(() => {
    if (prevKarmaRef.current === karma) return undefined;
    prevKarmaRef.current = karma;
    if (reducedMotion) return undefined;

    pulseScale.set(1);
    pulseOpacity.set(0.6);
    const controls = animate(pulseScale, 1.5, { duration: 0.8 });
    animate(pulseOpacity, 0, { duration: 0.8 });
    return () => controls.stop();
  }, [karma, reducedMotion, pulseOpacity, pulseScale]);

  // Color based on karma level
  const color =
    karma >= KARMA_HIGH_THRESHOLD
      ? { main: 'var(--cyber-cyan)', glow: 'rgb(var(--cyber-cyan-rgb) / 0.3)' } // cyan
      : karma <= KARMA_LOW_THRESHOLD
        ? { main: '#f43f5e', glow: 'rgba(244,63,94,0.3)' } // rose
        : { main: '#fbbf24', glow: 'rgba(251,191,36,0.3)' }; // amber

  // Map karma 0-100 to rotation -135 to 135 degrees
  const rotation = -135 + (karma / 100) * 270;
  const tierLabel = getKarmaTierLabel(karma);

  return (
    <div
      className="fixed pointer-events-none hidden lg:block"
      data-exploration-ui
      data-testid="moral-compass-hud"
      style={{
        zIndex: UI_LAYERS.HUD,
        bottom: bottomMoralCompassPx(),
        right: bottomRightInsetPx(),
        ...quietStyle,
      }}
      role="img"
      aria-label={`Карма ${karma}, ${tierLabel}`}
    >
      <div className="relative w-12 h-12">
        {/* Outer ring */}
        <svg width="48" height="48" viewBox="0 0 48 48" className="absolute inset-0">
          {/* Background circle */}
          <circle
            cx="24"
            cy="24"
            r="20"
            fill="none"
            stroke="rgba(30,30,40,0.8)"
            strokeWidth="3"
          />
          {/* Gradient arc */}
          <circle
            cx="24"
            cy="24"
            r="20"
            fill="none"
            stroke={color.main}
            strokeWidth="3"
            strokeDasharray={`${(karma / 100) * 125.6} 125.6`}
            strokeLinecap="round"
            transform="rotate(-90 24 24)"
            opacity="0.7"
          />
        </svg>

        {/* Pulse glow */}
        <motion.div
          style={{
            scale: pulseScale,
            opacity: pulseOpacity,
            boxShadow: `0 0 12px ${color.glow}`,
          }}
          className="absolute inset-0 rounded-full pointer-events-none"
        />

        {/* Needle */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          <div
            className="w-0.5 h-5 rounded-full"
            style={{ backgroundColor: color.main, transformOrigin: 'bottom center' }}
          />
        </div>

        {/* Center dot */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
          style={{ backgroundColor: color.main }}
        />

        {/* Value */}
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-center">
          <div className="text-[9px] font-medium leading-none" style={{ color: color.main }}>
            {karma}
          </div>
          <div className="text-[7px] font-mono uppercase tracking-wide mt-0.5 whitespace-nowrap" style={{ color: color.main, opacity: 0.85 }}>
            {tierLabel}
          </div>
        </div>
      </div>
    </div>
  );
}
