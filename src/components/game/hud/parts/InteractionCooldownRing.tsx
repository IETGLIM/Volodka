/* ─── Volodka RPG – Interaction Cooldown Ring ───
   Small SVG ring around the crosshair that shows a cooldown animation
   when the player interacts with objects. Uses event bus to listen for
   interaction:start events and shows a ~0.8s cooldown sweep.
*/

import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { eventBus } from '@/engine/EventBus';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';

const RING_RADIUS = 16;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS; // ~100.53
const COOLDOWN_MS = 800;

export function InteractionCooldownRing() {
  const reducedMotion = useEffectiveReducedMotion();
  const [active, setActive] = useState(false);
  const [key, setKey] = useState(0);

  const triggerCooldown = useCallback(() => {
    if (reducedMotion) return;
    setActive(false);
    // Force re-mount for animation restart
    setKey((k) => k + 1);
    requestAnimationFrame(() => {
      setActive(true);
    });
    // Clear after cooldown
    setTimeout(() => {
      setActive(false);
    }, COOLDOWN_MS + 100);
  }, [reducedMotion]);

  useEffect(() => {
    const unsubStart = eventBus.on('interaction:start', triggerCooldown);
    const unsubEnd = eventBus.on('interaction:end', triggerCooldown);
    return () => {
      unsubStart();
      unsubEnd();
    };
  }, [triggerCooldown]);

  return (
    <div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
      aria-hidden="true"
    >
      <AnimatePresence>
        {active && (
          <motion.svg
            key={key}
            width={44}
            height={44}
            viewBox="0 0 44 44"
            initial={reducedMotion ? { opacity: 0.5 } : { opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.8, scale: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 1.2 }}
            transition={{ duration: 0.15 }}
            className="hud-filmic-cooldown-tick -rotate-90"
          >
            {/* Background ring (dim) */}
            <circle
              cx="22"
              cy="22"
              r={RING_RADIUS}
              fill="none"
              stroke="rgb(var(--cyber-cyan-rgb) / 0.1)"
              strokeWidth={1.5}
            />
            {/* Animated sweep ring */}
            <circle
              cx="22"
              cy="22"
              r={RING_RADIUS}
              fill="none"
              stroke="rgb(var(--cyber-cyan-rgb) / 0.5)"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              className="cooldown-ring-active"
              style={{
                filter: 'drop-shadow(0 0 3px rgb(var(--cyber-cyan-rgb) / 0.4))',
              }}
            />
          </motion.svg>
        )}
      </AnimatePresence>
    </div>
  );
}