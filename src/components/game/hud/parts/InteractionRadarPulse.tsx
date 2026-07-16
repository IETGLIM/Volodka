/* ─── Volodka RPG – Interaction Radar Pulse ───
 * Renders expanding radar-ping rings around the crosshair area
 * when the player is moving (within 2 seconds of last footstep).
 * Includes a rotating sweep line for a radar-screen aesthetic.
 * Animations are disabled when effective reduced motion is active.
 */

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { eventBus } from '@/engine/EventBus';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';

const MOVEMENT_TIMEOUT_MS = 2000;
const CONTAINER_SIZE = 50;

export function InteractionRadarPulse() {
  const [isMoving, setIsMoving] = useState(false);
  const lastFootstepRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reducedMotion = useEffectiveReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      setIsMoving(false);
      return;
    }

    const unsub = eventBus.on('exploration:footstep', () => {
      lastFootstepRef.current = Date.now();
      setIsMoving(true);

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        // Only hide if no new footstep arrived within the window
        if (Date.now() - lastFootstepRef.current >= MOVEMENT_TIMEOUT_MS) {
          setIsMoving(false);
        }
      }, MOVEMENT_TIMEOUT_MS);
    });

    return () => {
      unsub();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [reducedMotion]);

  // Don't render at all if reduced motion
  if (reducedMotion) return null;

  const half = CONTAINER_SIZE / 2;
  const ringSize = 40;

  return (
    <div
      className="radar-proximity-container pointer-events-none"
      style={{
        width: CONTAINER_SIZE,
        height: CONTAINER_SIZE,
      }}
      aria-hidden="true"
    >
      <AnimatePresence>
        {isMoving && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="relative w-full h-full"
          >
            {/* Primary ring */}
            <div
              className="radar-ping absolute rounded-full"
              style={{
                width: ringSize,
                height: ringSize,
                top: (CONTAINER_SIZE - ringSize) / 2,
                left: (CONTAINER_SIZE - ringSize) / 2,
                border: '1px solid rgb(var(--cyber-cyan-rgb) / 0.5)',
                boxShadow: '0 0 4px rgb(var(--cyber-cyan-rgb) / 0.2)',
              }}
            />

            {/* Delayed ring */}
            <div
              className="radar-ping-delayed absolute rounded-full"
              style={{
                width: ringSize,
                height: ringSize,
                top: (CONTAINER_SIZE - ringSize) / 2,
                left: (CONTAINER_SIZE - ringSize) / 2,
                border: '1px solid rgb(var(--cyber-cyan-rgb) / 0.35)',
                boxShadow: '0 0 3px rgb(var(--cyber-cyan-rgb) / 0.15)',
              }}
            />

            {/* Radar sweep line */}
            <div
              className="radar-sweep absolute"
              style={{
                width: 1,
                height: half - 2,
                top: 2,
                left: half,
                transformOrigin: 'bottom center',
                background: 'linear-gradient(180deg, rgb(var(--cyber-cyan-rgb) / 0.5), transparent)',
                borderRadius: 1,
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}