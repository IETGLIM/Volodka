'use client';

/* ─── Interaction Ripple Effect — 2D expanding ring on object interact ─── */

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { eventBus } from '@/engine/EventBus';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { useOrchestratorShell } from '@/store/selectors';

/** Duration of the ripple animation in ms. */
const RIPPLE_DURATION_MS = 780;

interface RippleState {
  key: number;
  accent: 'cyan' | 'magenta';
}

/**
 * 2D overlay: expanding ring from screen center on interact / journal pulse.
 * Only active during exploration mode.
 */
export function InteractionRippleEffect() {
  const { mode } = useOrchestratorShell();
  const reducedMotion = useEffectiveReducedMotion();
  const [ripple, setRipple] = useState<RippleState | null>(null);
  const keyCounter = useRef(0);

  const showRipple = useCallback((accent: RippleState['accent'] = 'cyan') => {
    if (mode !== 'exploration') return;
    keyCounter.current += 1;
    setRipple({ key: keyCounter.current, accent });
  }, [mode]);

  useEffect(() => {
    const unsubInteract = eventBus.on('object:interact', () => {
      showRipple('cyan');
    });
    const unsubPulse = eventBus.on('quest:pulse_marker', () => {
      showRipple('magenta');
    });
    return () => {
      unsubInteract();
      unsubPulse();
    };
  }, [showRipple]);

  if (mode !== 'exploration') return null;

  const isMagenta = ripple?.accent === 'magenta';
  const ringColor = isMagenta ? 'rgba(214, 180, 160, 0.55)' : 'rgba(214, 211, 209, 0.5)';
  const glowColor = isMagenta ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.18)';
  const innerColor = isMagenta ? 'rgba(214, 180, 160, 0.35)' : 'rgba(214, 211, 209, 0.28)';
  const dotColor = isMagenta ? 'rgba(231, 229, 228, 0.85)' : 'rgba(231, 229, 228, 0.8)';

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
                  opacity: [0.8, 0.4, 0],
                  scale: [0, 1.12],
                }
          }
          exit={reducedMotion ? { opacity: 0 } : { opacity: 0 }}
          transition={
            reducedMotion
              ? { duration: 0.2 }
              : { duration: RIPPLE_DURATION_MS / 1000, ease: [0.16, 1, 0.3, 1] }
          }
          onAnimationComplete={() => setRipple(null)}
        >
          <div
            className="absolute rounded-full"
            style={{
              width: 220,
              height: 220,
              border: `1.5px solid ${ringColor}`,
              opacity: 0.55,
              boxShadow: `0 0 28px ${glowColor}`,
            }}
          />
          <div
            className="absolute rounded-full"
            style={{
              width: 176,
              height: 176,
              border: `2px solid ${ringColor}`,
              boxShadow: `0 0 24px ${glowColor}, inset 0 0 20px ${glowColor}`,
            }}
          />
          <div
            className="absolute rounded-full"
            style={{
              width: 100,
              height: 100,
              border: `1.5px solid ${innerColor}`,
              boxShadow: `0 0 12px ${glowColor}`,
            }}
          />
          <div
            className="absolute rounded-full"
            style={{
              width: 52,
              height: 52,
              border: `1px solid ${innerColor}`,
              boxShadow: `0 0 10px ${glowColor}`,
            }}
          />
          <div
            className="absolute rounded-full"
            style={{
              width: 6,
              height: 6,
              backgroundColor: dotColor,
              boxShadow: `0 0 8px ${glowColor}`,
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
