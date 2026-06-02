'use client';

/* ─── Volodka RPG – Karma/moral compass HUD */

import { motion, useMotionValue, animate } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { KARMA_LOW_THRESHOLD, KARMA_HIGH_THRESHOLD } from '@/data/constants';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { useEffect, useRef } from 'react';

export function MoralCompassHUD() {
  const karma = useGameStore((s) => s.playerState.karma);

  // Pulse animation via motion value
  const pulseScale = useMotionValue(1);
  const pulseOpacity = useMotionValue(0);
  const prevKarmaRef = useRef(karma);

  useEffect(() => {
    // Only trigger pulse when karma actually changes
    if (prevKarmaRef.current === karma) return;
    prevKarmaRef.current = karma;

    pulseScale.set(1);
    pulseOpacity.set(0.6);
    const controls = animate(pulseScale, 1.5, { duration: 0.8 });
    animate(pulseOpacity, 0, { duration: 0.8 });
    return () => controls.stop();
  }, [karma]);

  // Color based on karma level
  const color =
    karma >= KARMA_HIGH_THRESHOLD
      ? { main: '#22d3ee', glow: 'rgba(34,211,238,0.3)' } // cyan
      : karma <= KARMA_LOW_THRESHOLD
        ? { main: '#f43f5e', glow: 'rgba(244,63,94,0.3)' } // rose
        : { main: '#fbbf24', glow: 'rgba(251,191,36,0.3)' }; // amber

  // Map karma 0-100 to rotation -135 to 135 degrees
  const rotation = -135 + (karma / 100) * 270;

  return (
    <div className="fixed bottom-16 right-12 pointer-events-none hidden lg:block" data-exploration-ui style={{ zIndex: UI_LAYERS.HUD }}>
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
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-medium" style={{ color: color.main }}>
          {karma}
        </div>
      </div>
    </div>
  );
}
