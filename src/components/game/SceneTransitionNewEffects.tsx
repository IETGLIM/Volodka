/* ─── Volodka RPG – New Scene Transition Effects ───
 *  Standalone transition effect components that can be composed
 *  into the SceneTransitionOverlay or used independently.
 *
 *  - 'breathe_zoom': Slow zoom with breathing opacity pulse
 *  - 'data_stream': Matrix-style data cascade effect
 */

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { GlitchRevealTransition } from './SceneTransitionGlitchReveal';
import { PoemDissolveTransition } from './SceneTransitionPoemDissolve';

/* ══════════════════════════════════════════════════════════════
   TYPES
   ══════════════════════════════════════════════════════════════ */

export type NewTransitionType = 'breathe_zoom' | 'data_stream' | 'glitch_reveal' | 'poem_dissolve';

export interface TransitionEffectProps {
  /** Accent color matching the scene transition palette */
  accentColor: string;
  /** Duration of the effect in seconds */
  duration: number;
  /** Whether reduced motion is enabled */
  reducedMotion?: boolean;
}

/* ══════════════════════════════════════════════════════════════
   SEEDED RANDOM
   ══════════════════════════════════════════════════════════════ */

const seededRand = (seed: number): number => {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  const fract = x - Math.floor(x);
  return Number.isFinite(fract) ? fract : 0;
};

/* ══════════════════════════════════════════════════════════════
   BREATHE_ZOOM — Slow zoom with breathing opacity
   ══════════════════════════════════════════════════════════════ */

/** Duration constants (ms) for the new transition types */
export const NEW_TRANSITION_DURATIONS = {
  BREATHE_ZOOM_IN: 800,
  BREATHE_ZOOM_HOLD: 400,
  BREATHE_ZOOM_OUT: 1000,
  DATA_STREAM_IN: 600,
  DATA_STREAM_HOLD: 500,
  DATA_STREAM_OUT: 800,
  GLITCH_REVEAL_IN: 750,
  GLITCH_REVEAL_HOLD: 400,
  GLITCH_REVEAL_OUT: 600,
  POEM_DISSOLVE_IN: 900,
  POEM_DISSOLVE_HOLD: 400,
  POEM_DISSOLVE_OUT: 700,
} as const;

/** Breathing easing — slow, organic feel */
const BREATHE_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const BreatheZoomTransition = memo(function BreatheZoomTransition({
  accentColor,
  duration,
  reducedMotion = false,
}: TransitionEffectProps) {
  const dur = reducedMotion ? 0.01 : duration;

  return (
    <motion.div
      className="absolute inset-0 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.2, ease: 'easeInOut' } }}
      aria-hidden="true"
    >
      {/* Slow zoom overlay — scale from 0.96 to 1.04 with opacity breathing */}
      <motion.div
        className="absolute inset-0 bg-black"
        style={{ transformOrigin: 'center center' }}
        initial={reducedMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.96 }}
        animate={
          reducedMotion
            ? { opacity: 1, scale: 1 }
            : {
                opacity: [0, 0.3, 0.6, 0.85, 1],
                scale: [0.96, 0.98, 1.0, 1.02, 1.04],
              }
        }
        transition={{
          duration: dur,
          ease: BREATHE_EASE,
        }}
      >
        {/* Radial vignette that expands with the zoom */}
        <motion.div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(
              ellipse at center,
              ${accentColor}08 0%,
              transparent 50%,
              rgba(0, 0, 0, 0.4) 100%
            )`,
          }}
          initial={reducedMotion ? { opacity: 0.4, scale: 1 } : { opacity: 0, scale: 0.9 }}
          animate={
            reducedMotion
              ? { opacity: 0.4, scale: 1 }
              : {
                  opacity: [0, 0.3, 0.6, 0.5, 0.4],
                  scale: [0.9, 0.95, 1.0, 1.05, 1.1],
                }
          }
          transition={{
            duration: dur,
            ease: BREATHE_EASE,
          }}
        />

        {/* Breathing opacity pulse ring */}
        {!reducedMotion && (
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              className="rounded-full"
              style={{
                width: '50vmin',
                height: '50vmin',
                border: `1px solid ${accentColor}18`,
                boxShadow: `0 0 80px 30px ${accentColor}06`,
              }}
              animate={{
                scale: [0.7, 1.15, 1.4],
                opacity: [0, 0.35, 0],
              }}
              transition={{ duration: dur, ease: 'easeOut' }}
            />
          </div>
        )}

        {/* Secondary pulse ring — offset timing */}
        {!reducedMotion && (
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              className="rounded-full"
              style={{
                width: '70vmin',
                height: '70vmin',
                border: `1px solid ${accentColor}10`,
              }}
              animate={{
                scale: [0.85, 1.1, 1.3],
                opacity: [0, 0.2, 0],
              }}
              transition={{ duration: dur * 1.2, ease: 'easeOut' }}
            />
          </div>
        )}
      </motion.div>
    </motion.div>
  );
});

/* ══════════════════════════════════════════════════════════════
   DATA_STREAM — Matrix-style data cascade effect
   ══════════════════════════════════════════════════════════════ */

const DATA_STREAM_CHARS = '01アイウエオカキクケコ{}[]<>/\|=+-_*&%$#@!АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЩЭЮЯ';

interface DataStreamColumn {
  id: number;
  left: string;
  delay: string;
  speed: string;
  chars: string;
  opacity: string;
}

export const DataStreamTransition = memo(function DataStreamTransition({
  accentColor,
  duration,
  reducedMotion = false,
}: TransitionEffectProps) {
  const columns = useMemo<DataStreamColumn[]>(() => {
    return Array.from({ length: 30 }, (_, i) => {
      // Generate a random string of chars for this column
      let chars = '';
      for (let c = 0; c < 20; c++) {
        chars += DATA_STREAM_CHARS[Math.floor(seededRand(i * 100 + c) * DATA_STREAM_CHARS.length)];
      }
      return {
        id: i,
        left: (seededRand(i * 7) * 100).toFixed(2),
        delay: (seededRand(i * 13 + 50) * duration * 0.4).toFixed(2),
        speed: (1.5 + seededRand(i * 19 + 100) * 2).toFixed(2),
        chars,
        opacity: (0.15 + seededRand(i * 23 + 200) * 0.35).toFixed(2),
      };
    });
  }, [duration]);

  const dur = reducedMotion ? 0.01 : duration;

  return (
    <motion.div
      className="absolute inset-0 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.2, ease: 'easeInOut' } }}
      aria-hidden="true"
    >
      {/* Dark base overlay */}
      <motion.div
        className="absolute inset-0"
        style={{ background: 'rgba(0, 2, 8, 0.92)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: dur * 0.3, ease: 'easeIn' }}
      />

      {/* Data cascade columns */}
      {!reducedMotion &&
        columns.map((col) => (
          <motion.div
            key={col.id}
            className="absolute top-0 bottom-0"
            style={{
              left: `${col.left}%`,
              width: '14px',
              fontFamily: 'monospace',
              fontSize: '11px',
              lineHeight: '14px',
              color: accentColor,
              textShadow: `0 0 8px ${accentColor}80`,
              overflow: 'hidden',
              opacity: 0,
            }}
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, parseFloat(col.opacity), parseFloat(col.opacity) * 0.6, 0],
            }}
            transition={{
              duration: dur,
              delay: parseFloat(col.delay) / 1000,
              ease: 'easeInOut',
            }}
          >
            {/* Falling character stream */}
            <motion.div
              style={{ whiteSpace: 'pre' }}
              initial={{ y: '-100%' }}
              animate={{ y: '100%' }}
              transition={{
                duration: parseFloat(col.speed),
                repeat: Infinity,
                ease: 'linear',
              }}
            >
              {col.chars}
            </motion.div>

            {/* Bright head of the stream */}
            <motion.div
              className="absolute top-0 left-0 right-0"
              style={{
                height: '20px',
                background: `linear-gradient(180deg, ${accentColor}60, transparent)`,
              }}
              initial={{ y: '-100%' }}
              animate={{ y: '100vh' }}
              transition={{
                duration: parseFloat(col.speed),
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          </motion.div>
        ))}

      {/* Central bright flash at peak */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at center, ${accentColor}20 0%, transparent 60%)`,
        }}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{
          opacity: [0, 0, 0.8, 0.6, 0],
          scale: [0.5, 0.8, 1.2, 1.5, 2],
        }}
        transition={{
          duration: dur,
          ease: 'easeInOut',
        }}
      />

      {/* Horizontal scan line sweep */}
      {!reducedMotion && (
        <motion.div
          className="absolute left-0 right-0"
          style={{
            height: '2px',
            background: accentColor,
            boxShadow: `0 0 12px 4px ${accentColor}60, 0 0 30px 8px ${accentColor}20`,
          }}
          initial={{ y: '-5%', opacity: 0 }}
          animate={{
            y: ['0%', '30%', '60%', '100%'],
            opacity: [0, 0.8, 0.6, 0],
          }}
          transition={{
            duration: dur * 0.8,
            ease: 'linear',
          }}
        />
      )}

      {/* Reduced motion fallback: simple grid pattern */}
      {reducedMotion && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `repeating-linear-gradient(
              0deg,
              transparent 0px,
              transparent 3px,
              ${accentColor}08 3px,
              ${accentColor}08 4px
            ), repeating-linear-gradient(
              90deg,
              transparent 0px,
              transparent 6px,
              ${accentColor}05 6px,
              ${accentColor}05 7px
            )`,
          }}
        />
      )}
    </motion.div>
  );
});

/* ══════════════════════════════════════════════════════════════
   COMPOSITE — Renders the correct effect by type
   ══════════════════════════════════════════════════════════════ */

export interface NewTransitionEffectProps extends TransitionEffectProps {
  type: NewTransitionType;
}

export const NewTransitionEffect = memo(function NewTransitionEffect({
  type,
  ...props
}: NewTransitionEffectProps) {
  switch (type) {
    case 'breathe_zoom':
      return <BreatheZoomTransition {...props} />;
    case 'data_stream':
      return <DataStreamTransition {...props} />;
    case 'glitch_reveal':
      return <GlitchRevealTransition {...props} />;
    case 'poem_dissolve':
      return <PoemDissolveTransition {...props} />;
    default:
      return null;
  }
});
