/* ─── Volodka RPG – Interaction Proximity Glow ───
   Renders a soft breathing glow aura around the crosshair when near
   interactive objects. Uses the same proximity data as CrosshairInteractionPrompt.
*/

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { eventBus } from '@/engine/EventBus';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';

export function InteractionProximityGlow() {
  const [isNear, setIsNear] = useState(false);
  const reducedMotion = useEffectiveReducedMotion();

  useEffect(() => {
    const unsubHint = eventBus.on('interaction:hint', () => setIsNear(true));
    const unsubEnd = eventBus.on('interaction:end', () => setIsNear(false));
    const unsubStart = eventBus.on('interaction:start', () => setIsNear(false));
    return () => {
      unsubHint();
      unsubEnd();
      unsubStart();
    };
  }, []);

  return (
    <AnimatePresence>
      {isNear && (
        <motion.div
          key="proximity-glow"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.6 }}
          transition={{ duration: 0.25 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          aria-hidden="true"
        >
          {/* Outer expanding ring */}
          {!reducedMotion && (
            <div className="proximity-glow-ring" style={{ width: 80, height: 80, margin: -40 }} />
          )}
          {/* Inner glow aura */}
          <div
            className="proximity-glow-aura flex items-center justify-center"
            style={{
              width: 48,
              height: 48,
              margin: -24,
              background: reducedMotion
                ? 'radial-gradient(circle, rgb(var(--cyber-cyan-rgb) / 0.15) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgb(var(--cyber-cyan-rgb) / 0.2) 0%, rgb(var(--cyber-cyan-rgb) / 0.05) 50%, transparent 70%)',
              animation: reducedMotion ? 'none' : undefined,
            }}
          >
            <div className="proximity-glow-inner" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}