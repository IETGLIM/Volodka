'use client';

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';

interface NeonSignProps {
  text: string;
  x: number;
  y: number;
  color: string;
  fontSize?: number;
  flickerSpeed?: number;
}

const NeonSign = memo(function NeonSign({ text, x, y, color, fontSize = 14, flickerSpeed = 5 }: NeonSignProps) {
  // Parse color for opacity variants
  const glowShadow = useMemo(() => {
    return `0 0 7px ${color}, 0 0 14px ${color}, 0 0 28px ${color}80, 0 0 50px ${color}40`;
  }, [color]);

  const dimShadow = useMemo(() => {
    return `0 0 2px ${color}80, 0 0 5px ${color}40`;
  }, [color]);

  return (
    <motion.div
      className="absolute select-none"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        fontFamily: 'var(--font-geist-mono), monospace',
        fontSize,
        fontWeight: 700,
        letterSpacing: '0.15em',
        color,
      }}
      animate={{
        textShadow: [glowShadow, dimShadow, glowShadow, dimShadow, glowShadow],
        opacity: [1, 0.7, 1, 0.85, 1],
      }}
      transition={{
        duration: flickerSpeed,
        repeat: Infinity,
        ease: 'easeInOut',
        times: [0, 0.15, 0.16, 0.7, 1],
      }}
    >
      {text}
    </motion.div>
  );
});
