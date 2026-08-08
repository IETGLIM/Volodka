/* ─── Volodka RPG – Interaction Distance Ring ───
 * A dynamic ring around the crosshair that appears when near
 * interactive objects. The ring scales and glows based on proximity.
 * Tick marks appear when within interaction range.
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { eventBus } from '@/engine/EventBus';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import {
  INTERACTION_IN_RANGE_FRACTION,
  NPC_INTERACTION_QUERY_RANGE,
} from '@/engine/player/playerConstants';

const RING_MAX_SIZE = 56;
const RING_MIN_SIZE = 32;
const DECAY_MS = 800;

export function InteractionDistanceRing() {
  const [visible, setVisible] = useState(false);
  const [proximity01, setProximity01] = useState(1);
  const lastHintRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reducedMotion = useEffectiveReducedMotion();

  useEffect(() => {
    const unsubHint = eventBus.on('interaction:hint', (payload) => {
      lastHintRef.current = Date.now();
      setVisible(true);
      const maxRange = payload.maxRange && payload.maxRange > 0
        ? payload.maxRange
        : NPC_INTERACTION_QUERY_RANGE;
      const distance = typeof payload.distance === 'number' ? payload.distance : 0;
      const next = 1 - Math.min(1, Math.max(0, distance / maxRange));
      setProximity01(next);

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

    const unsubStuck = eventBus.on('interaction:stuck_recovery', () => {
      // Juice: keep ring primed until emitStuckRecoveryNpcRingFocus fires hint.
      lastHintRef.current = Date.now();
      setVisible(true);
      setProximity01(0.85);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        if (Date.now() - lastHintRef.current >= DECAY_MS * 2) {
          setVisible(false);
        }
      }, DECAY_MS * 2);
    });

    return () => {
      unsubHint();
      unsubEnd();
      unsubStart();
      unsubStuck();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!visible) return null;

  // Reduced motion: keep a static in-range tick instead of hiding entirely.
  if (reducedMotion) {
    const inRange = proximity01 >= INTERACTION_IN_RANGE_FRACTION;
    if (!inRange) return null;
    return (
      <div
        className="absolute top-1/2 left-1/2 pointer-events-none size-9 rounded-full border border-cyan-400/45"
        aria-hidden="true"
        style={{ marginLeft: -18, marginTop: -18 }}
      />
    );
  }

  const ringSize = RING_MIN_SIZE + (RING_MAX_SIZE - RING_MIN_SIZE) * proximity01;
  const inRange = proximity01 >= INTERACTION_IN_RANGE_FRACTION;
  const borderAlpha = 0.25 + proximity01 * 0.4;
  const glowAlpha = 0.1 + proximity01 * 0.25;

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
          <motion.div
            animate={{
              width: ringSize,
              height: ringSize,
              borderColor: `rgb(var(--cyber-cyan-rgb) / ${borderAlpha})`,
              boxShadow: inRange
                ? `0 0 16px rgb(var(--cyber-cyan-rgb) / ${glowAlpha + 0.08}), inset 0 0 10px rgb(var(--cyber-cyan-rgb) / 0.12)`
                : `0 0 12px rgb(var(--cyber-cyan-rgb) / ${glowAlpha}), inset 0 0 8px rgb(var(--cyber-cyan-rgb) / 0.08)`,
            }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className={`rounded-full border ${inRange ? 'distance-ring-in-range' : ''}`}
            style={{ borderWidth: inRange ? 1.5 : 1, marginLeft: -ringSize / 2, marginTop: -ringSize / 2 }}
          />
          {inRange && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="absolute"
              style={{
                width: ringSize,
                height: ringSize,
                marginLeft: -ringSize / 2,
                marginTop: -ringSize / 2,
              }}
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
          {inRange && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute rounded-full distance-ring-fill hud-filmic-distance-ring-expand"
              style={{
                width: ringSize - 8,
                height: ringSize - 8,
                marginLeft: -(ringSize - 8) / 2,
                marginTop: -(ringSize - 8) / 2,
                background: 'radial-gradient(circle, rgb(var(--cyber-cyan-rgb) / 0.04) 0%, transparent 70%)',
              }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
