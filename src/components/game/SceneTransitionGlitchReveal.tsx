'use client';

/* ─── Volodka RPG – Glitch Reveal Transition Effect ───
 * Cyberpunk digital glitch effect with RGB split, scan lines,
 * and data corruption patterns.
 */

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';

export interface TransitionEffectProps {
  accentColor: string;
  duration: number;
  reducedMotion?: boolean;
}

const seededRand = (seed: number): number => {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  const fract = x - Math.floor(x);
  return Number.isFinite(fract) ? fract : 0;
};

interface GlitchSlice {
  id: number;
  top: string;
  height: string;
  delay: string;
  offset: string;
  skewX: string;
  opacity: string;
  channelOffset: string;
}

export const GlitchRevealTransition = memo(function GlitchRevealTransition({
  accentColor,
  duration,
  reducedMotion = false,
}: TransitionEffectProps) {
  const dur = reducedMotion ? 0.01 : duration;

  const slices = useMemo<GlitchSlice[]>(() => {
    return Array.from({ length: 18 }, (_, i) => ({
      id: i,
      top: (seededRand(i * 31) * 100).toFixed(2),
      height: (2 + seededRand(i * 47) * 8).toFixed(1),
      delay: (seededRand(i * 13 + 50) * 0.3).toFixed(3),
      offset: ((seededRand(i * 19 + 100) - 0.5) * 40).toFixed(1),
      skewX: ((seededRand(i * 23 + 200) - 0.5) * 6).toFixed(1),
      opacity: (0.3 + seededRand(i * 29 + 300) * 0.7).toFixed(2),
      channelOffset: ((seededRand(i * 37 + 400) - 0.5) * 12).toFixed(1),
    }));
  }, []);

  const corruptionBlocks = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => ({
      id: i,
      left: (seededRand(i * 41 + 500) * 100).toFixed(2),
      top: (seededRand(i * 43 + 600) * 100).toFixed(2),
      width: (10 + seededRand(i * 47 + 700) * 30).toFixed(1),
      height: (2 + seededRand(i * 53 + 800) * 4).toFixed(1),
      delay: (seededRand(i * 59 + 900) * 0.5).toFixed(3),
    }));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.2, ease: 'easeInOut' } }}
      aria-hidden="true"
    >
      {/* Dark base */}
      <motion.div
        className="absolute inset-0"
        style={{ background: 'rgba(2, 0, 8, 0.94)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: dur * 0.2, ease: 'easeIn' }}
      />

      {/* Scan lines overlay */}
      {!reducedMotion && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `repeating-linear-gradient(
              0deg,
              transparent 0px,
              transparent 2px,
              rgba(0, 255, 255, 0.03) 2px,
              rgba(0, 255, 255, 0.03) 4px
            )`,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* RGB channel split horizontal slices */}
      {!reducedMotion &&
        slices.map((slice) => (
          <motion.div
            key={slice.id}
            className="absolute left-0 right-0"
            style={{
              top: `${slice.top}%`,
              height: `${slice.height}px`,
              overflow: 'hidden',
              mixBlendMode: 'screen',
            }}
            initial={{ opacity: 0, x: 0 }}
            animate={{
              opacity: [0, parseFloat(slice.opacity), parseFloat(slice.opacity) * 0.5, 0],
              x: [0, parseFloat(slice.offset), parseFloat(slice.offset) * 0.3, 0],
            }}
            transition={{
              duration: dur,
              delay: parseFloat(slice.delay),
              ease: 'easeInOut',
            }}
          >
            {/* Red channel */}
            <div
              className="absolute inset-0"
              style={{
                background: `rgba(255, 0, 80, 0.3)`,
                transform: `translateX(${slice.channelOffset}px)`,
              }}
            />
            {/* Blue channel */}
            <div
              className="absolute inset-0"
              style={{
                background: `rgba(0, 100, 255, 0.3)`,
                transform: `translateX(-${slice.channelOffset}px)`,
              }}
            />
            {/* Green channel (center) */}
            <div
              className="absolute inset-0"
              style={{
                background: `rgba(0, 255, 100, 0.15)`,
              }}
            />
          </motion.div>
        ))}

      {/* Data corruption blocks */}
      {!reducedMotion &&
        corruptionBlocks.map((block) => (
          <motion.div
            key={`block-${block.id}`}
            className="absolute"
            style={{
              left: `${block.left}%`,
              top: `${block.top}%`,
              width: `${block.width}%`,
              height: `${block.height}px`,
              background: accentColor,
              opacity: 0,
              mixBlendMode: 'screen',
            }}
            animate={{
              opacity: [0, 0.4, 0, 0.3, 0],
              scaleX: [0.8, 1.2, 0.9, 1.1, 0.8],
            }}
            transition={{
              duration: dur * 0.6,
              delay: parseFloat(block.delay),
              ease: 'easeInOut',
            }}
          />
        ))}

      {/* Horizontal glitch displacement bands */}
      {!reducedMotion && (
        <>
          <motion.div
            className="absolute left-0 right-0"
            style={{
              height: '3px',
              background: accentColor,
              boxShadow: `0 0 20px 6px ${accentColor}80, 0 0 40px 12px ${accentColor}30`,
              mixBlendMode: 'screen',
            }}
            initial={{ y: '-10%', opacity: 0, scaleX: 0.5 }}
            animate={{
              y: ['0%', '25%', '50%', '75%', '100%'],
              opacity: [0, 0.8, 0.5, 0.7, 0],
              scaleX: [0.5, 1, 0.8, 1.1, 0.5],
            }}
            transition={{ duration: dur * 0.7, ease: 'linear' }}
          />
          <motion.div
            className="absolute left-0 right-0"
            style={{
              height: '1px',
              background: accentColor,
              opacity: 0.5,
            }}
            initial={{ y: '100%', opacity: 0 }}
            animate={{
              y: ['100%', '70%', '40%', '10%', '-10%'],
              opacity: [0, 0.6, 0.3, 0.5, 0],
            }}
            transition={{ duration: dur * 0.6, delay: 0.1, ease: 'linear' }}
          />
        </>
      )}

      {/* Center corruption flash */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at center, ${accentColor}15 0%, transparent 60%)`,
        }}
        initial={{ opacity: 0, scale: 0.3 }}
        animate={{
          opacity: [0, 0, 1, 0.6, 0],
          scale: [0.3, 0.6, 1.0, 1.4, 1.8],
        }}
        transition={{ duration: dur, ease: 'easeInOut' }}
      />

      {/* Reduced motion fallback: simple dark overlay with border */}
      {reducedMotion && (
        <motion.div
          className="absolute inset-0"
          style={{
            background: 'rgba(2, 0, 8, 0.94)',
            borderTop: `2px solid ${accentColor}40`,
            borderBottom: `2px solid ${accentColor}40`,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        />
      )}
    </motion.div>
  );
});
