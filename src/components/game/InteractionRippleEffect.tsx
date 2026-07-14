'use client';

/* ─── Interaction Ripple Effect — 2D expanding ring on object interact ─── */

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { eventBus } from '@/engine/EventBus';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { useOrchestratorShell } from '@/store/selectors';

/** Duration of the ripple animation in ms. */
const RIPPLE_DURATION_MS = 600;

interface RippleState {
  key: number;
}

/**
 * 2D overlay: a cyan/teal ring that expands from the screen center
 * and fades out over 600 ms when the player interacts with an object.
 * Only active during exploration mode.
 */
export function InteractionRippleEffect() {
  const { mode } = useOrchestratorShell();
  const reducedMotion = useEffectiveReducedMotion();
  const [ripple, setRipple] = useState<RippleState | null>(null);
  const keyCounter = useRef(0);

  const showRipple = useCallback(() => {
    if (mode !== 'exploration') return;
    keyCounter.current += 1;
    setRipple({ key: keyCounter.current });
  }, [mode]);

  /* ── Listen to object:interact on EventBus ── */
  useEffect(() => {
    const unsub = eventBus.on('object:interact', () => {
      showRipple();
    });
    return unsub;
  }, [showRipple]);

  if (mode !== 'exploration') return null;

  return (
    <AnimatePresence>
      {ripple && (
        <motion.div
          key={`ripple-${ripple.key}`}
          data-testid="interaction-ripple"
          className="fixed inset-0 flex items-center justify-center pointer-events-none"
          style={{ zIndex: 9 }} /* just above CANVAS (0) but below HUD (10) */
          initial={reducedMotion ? false : undefined}
          animate={
            reducedMotion
              ? { opacity: 0.6 }
              : {
                  opacity: [0.7, 0.3, 0],
                  scale: [0, 1],
                }
          }
          exit={reducedMotion ? { opacity: 0 } : { opacity: 0 }}
          transition={
            reducedMotion
              ? { duration: 0.2 }
              : { duration: RIPPLE_DURATION_MS / 1000, ease: 'easeOut' }
          }
          onAnimationComplete={() => setRipple(null)}
        >
          {/* Outer ring */}
          <div
            className="absolute rounded-full"
            style={{
              width: 160,
              height: 160,
              border: '2px solid rgba(34, 211, 238, 0.6)',
              boxShadow: '0 0 20px rgba(34, 211, 238, 0.15), inset 0 0 20px rgba(34, 211, 238, 0.05)',
            }}
          />
          {/* Inner ring */}
          <div
            className="absolute rounded-full"
            style={{
              width: 60,
              height: 60,
              border: '1px solid rgba(34, 211, 238, 0.35)',
              boxShadow: '0 0 10px rgba(34, 211, 238, 0.1)',
            }}
          />
          {/* Center dot */}
          <div
            className="absolute rounded-full"
            style={{
              width: 6,
              height: 6,
              backgroundColor: 'rgba(34, 211, 238, 0.8)',
              boxShadow: '0 0 8px rgba(34, 211, 238, 0.5)',
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}