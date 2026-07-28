/* ─── Volodka RPG – Interaction Distance Ring ───
 * A dynamic ring around the crosshair that appears when near
 * interactive objects. The ring scales and glows based on proximity.
 * Tick marks appear when within interaction range.
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { eventBus } from '@/engine/EventBus';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';

const _RING_MAX_SIZE = 56;
const RING_MIN_SIZE = 32;
const DECAY_MS = 800;

export function InteractionDistanceRing() {
  const [visible, setVisible] = useState(false);
  const lastHintRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reducedMotion = useEffectiveReducedMotion();

  useEffect(() => {
    const unsubHint = eventBus.on('interaction:hint', () => {
      lastHintRef.current = Date.now();
      setVisible(true);

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        if (Date.now() - lastHintRef.current >= DECAY_MS) {
          setVisible(false);
        }
      }, DECAY_MS);
    });

    const unsubEnd = eventBus.on('interaction:end', () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setVisible(false), 300);
    });

    const unsubStart = eventBus.on('interaction:start', () => {
      setVisible(false);
    });

    return () => {
      unsubHint();
      unsubEnd();
      unsubStart();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (reducedMotion || !visible) return null;

  // When visible, we're close enough — show full in-range ring
  const ringSize = RING_MIN_SIZE + 6;
  const inRange = true;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 1.3 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          aria-hidden="true"
        >
          {/* Outer proximity ring */}
          <motion.div
            animate={{
              width: ringSize,
              height: ringSize,
              borderColor: 'rgb(var(--cyber-cyan-rgb) / 0.5)',
              boxShadow: '0 0 12px rgb(var(--cyber-cyan-rgb) / 0.25), inset 0 0 8px rgb(var(--cyber-cyan-rgb) / 0.08)',
            }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="rounded-full border distance-ring-in-range"
            style={{ borderWidth: 1 }}
          />
          {/* Tick marks at cardinal points */}
          {inRange && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0"
            >
              {[0, 90, 180, 270].map((deg) => (
                <div
                  key={deg}
                  className="absolute left-1/2 top-1/2 distance-ring-tick"
                  style={{
                    width: 1,
                    height: 5,
                    background: 'rgb(var(--cyber-cyan-rgb) / 0.5)',
                    borderRadius: 1,
                    transform: `rotate(${deg}deg) translateY(-${ringSize / 2 - 3}px)`,
                    transformOrigin: 'center center',
                  }}
                />
              ))}
            </motion.div>
          )}
          {/* In-range fill glow */}
          {inRange && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-1 rounded-full distance-ring-fill"
              style={{
                background: 'radial-gradient(circle, rgb(var(--cyber-cyan-rgb) / 0.04) 0%, transparent 70%)',
              }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}