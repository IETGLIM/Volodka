'use client';

/* ─── Volodka RPG – Poem Dissolve Transition Effect ───
 * Ethereal text dissolve where atmospheric lines appear
 * briefly as the scene transitions, fading out characters
 * one by one — an introspective, literary fade.
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

/** Ethereal Russian words used in the dissolve (NOT poem content — atmospheric fragments) */
const DISSOLVE_WORDS = [
  'свет', 'тишина', 'время', 'путь', 'граница',
  'воздух', 'звук', 'тень', 'память', 'дорога',
  'сны', 'дождь', 'небо', 'беседа', 'зеркало',
];

interface DissolveLine {
  id: number;
  text: string;
  x: string;
  y: string;
  delay: string;
  charDuration: string;
  opacity: string;
  fontSize: string;
}

export const PoemDissolveTransition = memo(function PoemDissolveTransition({
  accentColor,
  duration,
  reducedMotion = false,
}: TransitionEffectProps) {
  const dur = reducedMotion ? 0.01 : duration;

  const lines = useMemo<DissolveLine[]>(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const word = DISSOLVE_WORDS[Math.floor(seededRand(i * 71) * DISSOLVE_WORDS.length)];
      const charCount = 3 + Math.floor(seededRand(i * 97 + 10) * 6);
      // Repeat or truncate to desired length
      let text = '';
      for (let c = 0; c < charCount; c++) {
        text += word[c % word.length];
        if (c < charCount - 1 && seededRand(i * 103 + c) > 0.4) text += ' ';
      }
      return {
        id: i,
        text,
        x: (10 + seededRand(i * 37 + 100) * 80).toFixed(1),
        y: (8 + seededRand(i * 41 + 200) * 84).toFixed(1),
        delay: (seededRand(i * 53 + 300) * dur * 0.4).toFixed(3),
        charDuration: (0.3 + seededRand(i * 59 + 400) * 0.5).toFixed(2),
        opacity: (0.1 + seededRand(i * 67 + 500) * 0.4).toFixed(2),
        fontSize: (10 + seededRand(i * 73 + 600) * 6).toFixed(0),
      };
    });
  }, [dur]);

  return (
    <motion.div
      className="absolute inset-0 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.2, ease: 'easeInOut' } }}
      aria-hidden="true"
    >
      {/* Soft dark base with warm undertone */}
      <motion.div
        className="absolute inset-0"
        style={{ background: 'rgba(8, 4, 16, 0.92)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: dur * 0.3, ease: 'easeIn' }}
      />

      {/* Soft vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at center, ${accentColor}06 0%, transparent 50%, rgba(0,0,0,0.3) 100%)`,
        }}
      />

      {/* Floating dissolving text lines */}
      {!reducedMotion &&
        lines.map((line) => (
          <motion.div
            key={line.id}
            className="absolute pointer-events-none"
            style={{
              left: `${line.x}%`,
              top: `${line.y}%`,
              fontFamily: '"Geist", ui-sans-serif, sans-serif',
              fontSize: `${line.fontSize}px`,
              color: accentColor,
              textShadow: `0 0 12px ${accentColor}40, 0 0 24px ${accentColor}20`,
              letterSpacing: '0.05em',
              whiteSpace: 'nowrap',
              opacity: 0,
            }}
            animate={{
              opacity: [
                0,
                parseFloat(line.opacity),
                parseFloat(line.opacity) * 0.8,
                0,
              ],
              y: [8, 0, -4, -8],
            }}
            transition={{
              duration: parseFloat(line.charDuration),
              delay: parseFloat(line.delay) / 1000,
              ease: 'easeInOut',
            }}
          >
            {/* Characters dissolving one by one */}
            {line.text.split('').map((char, ci) => (
              <motion.span
                key={ci}
                style={{ display: 'inline-block' }}
                animate={{
                  opacity: [0, 1, 1, 0],
                  y: [4, 0, 0, -4],
                }}
                transition={{
                  duration: parseFloat(line.charDuration) * 0.8,
                  delay: parseFloat(line.delay) / 1000 + ci * 0.04,
                  ease: 'easeInOut',
                }}
              >
                {char === ' ' ? '\u00A0' : char}
              </motion.span>
            ))}
          </motion.div>
        ))}

      {/* Central soft glow pulse */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.6, 0.3, 0] }}
        transition={{ duration: dur, ease: 'easeInOut' }}
      >
        <motion.div
          className="rounded-full"
          style={{
            width: '40vmin',
            height: '40vmin',
            border: `1px solid ${accentColor}10`,
            boxShadow: `0 0 60px 20px ${accentColor}08`,
          }}
          animate={{ scale: [0.8, 1.2, 1.5], opacity: [0, 0.3, 0] }}
          transition={{ duration: dur, ease: 'easeOut' }}
        />
      </motion.div>

      {/* Soft horizontal line that drifts down — like a page turning */}
      {!reducedMotion && (
        <motion.div
          className="absolute left-0 right-0"
          style={{
            height: '1px',
            background: `linear-gradient(90deg, transparent, ${accentColor}30, transparent)`,
          }}
          initial={{ y: '-5%', opacity: 0 }}
          animate={{
            y: ['0%', '30%', '60%', '90%', '105%'],
            opacity: [0, 0.5, 0.4, 0.3, 0],
          }}
          transition={{ duration: dur * 0.8, ease: 'linear' }}
        />
      )}

      {/* Reduced motion fallback: simple fade with border */}
      {reducedMotion && (
        <motion.div
          className="absolute inset-0"
          style={{
            background: 'rgba(8, 4, 16, 0.92)',
            borderTop: `1px solid ${accentColor}30`,
            borderBottom: `1px solid ${accentColor}30`,
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
