/* ─── Volodka RPG – Interaction Proximity Glow ───
   Renders a soft breathing glow aura around the crosshair when near
   interactive objects. Uses the same proximity data as CrosshairInteractionPrompt.

   Session 9: Added interaction-activate edge glow flash (haptic-like visual feedback).
*/

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { eventBus } from '@/engine/EventBus';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';

export function InteractionProximityGlow() {
  const [isNear, setIsNear] = useState(false);
  const [activateFlash, setActivateFlash] = useState(false);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reducedMotion = useEffectiveReducedMotion();

  useEffect(() => {
    const unsubHint = eventBus.on('interaction:hint', () => setIsNear(true));
    const unsubEnd = eventBus.on('interaction:end', () => setIsNear(false));
    const unsubStart = eventBus.on('interaction:start', () => {
      setIsNear(false);
      // Session 9: Haptic-like edge glow flash on interaction activate
      setActivateFlash(true);
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      flashTimerRef.current = setTimeout(() => setActivateFlash(false), 350);
    });
    return () => {
      unsubHint();
      unsubEnd();
      unsubStart();
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    };
  }, []);

  return (
    <>
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
              className="proximity-glow-aura hud-filmic-proximity-glow-breathe flex items-center justify-center"
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

      {/* Session 9: Screen edge glow flash on interaction activation */}
      <AnimatePresence>
        {activateFlash && !reducedMotion && (
          <motion.div
            key="interaction-edge-glow"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.25, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="fixed inset-0 pointer-events-none"
            aria-hidden="true"
            style={{
              zIndex: 5,
              boxShadow: 'inset 0 0 60px 10px rgb(var(--cyber-cyan-rgb) / 0.15), inset 0 0 120px 20px rgb(var(--cyber-cyan-rgb) / 0.05)',
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}