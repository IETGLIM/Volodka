'use client';

/* ─── Volodka RPG – Stress visual effect overlay ─── */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { UI_LAYERS } from '@/shared/constants/uiLayers';

export function StressIndicator() {
  const stress = useGameStore((s) => s.playerState.stress);

  // Only show effects when stress > 80
  if (stress <= 80) return null;

  const intensity = (stress - 80) / 20; // 0-1 range for 80-100

  return (
    <div className="fixed inset-0 pointer-events-none" data-exploration-ui style={{ zIndex: UI_LAYERS.HUD }}>
      {/* Scanline glitch overlay */}
      <motion.div
        animate={{
          opacity: [0.02 * intensity, 0.06 * intensity, 0.02 * intensity],
        }}
        transition={{
          duration: 0.5,
          repeat: Infinity,
          repeatType: 'reverse',
        }}
        className="absolute inset-0"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
        }}
      />

      {/* Color distortion — red tint at edges */}
      <motion.div
        animate={{
          opacity: [0.05 * intensity, 0.12 * intensity, 0.05 * intensity],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          repeatType: 'reverse',
        }}
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 50%, rgba(244,63,94,0.15) 100%)',
        }}
      />

      {/* Horizontal glitch bars */}
      <motion.div
        animate={{
          y: ['-2px', '2px', '-1px', '0px'],
        }}
        transition={{
          duration: 0.2,
          repeat: Infinity,
          repeatType: 'loop',
        }}
        className="absolute inset-0"
        style={{
          opacity: 0.03 * intensity,
          background: 'linear-gradient(transparent 40%, rgba(244,63,94,0.1) 42%, rgba(244,63,94,0.1) 44%, transparent 46%)',
        }}
      />
    </div>
  );
}
