/* ─── Volodka RPG – Interactable Sparkle ───
 * A subtle CSS-only sparkle/shimmer effect that appears when
 * an interactable object is within reach. Enhances the existing
 * InteractionProximityGlow with a more noticeable but still
 * subtle rotating star/cross pattern.
 *
 * This is "show don't tell" — the sparkle draws the eye without
 * a text prompt or popup. It uses the EventBus `interaction:hint`
 * event (same as InteractionProximityGlow) to know when an
 * interactable is nearby.
 *
 * Design:
 *  - CSS-only 4-pointed star rotating at 15% opacity
 *  - Uses hud-filmic-pulse-ring-cycle for the glow ring
 *  - Gated on reduced-motion
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { eventBus } from '@/engine/EventBus';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';

const SPARKLE_SIZE = 32;
const SPARKLE_ARM_LENGTH = 7;
const AMBER_RGB = '255, 179, 71';
const SPARKLE_OPACITY = 0.15;

export function InteractableSparkle() {
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

  if (reducedMotion) return null;

  return (
    <AnimatePresence>
      {isNear && (
        <motion.div
          key="interactable-sparkle"
          initial={{ opacity: 0, scale: 0.4 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          aria-hidden="true"
        >
          {/* Rotating 4-pointed star */}
          <div
            className="interactable-sparkle"
            style={{
              width: SPARKLE_SIZE,
              height: SPARKLE_SIZE,
              margin: -SPARKLE_SIZE / 2,
              position: 'absolute',
              top: '50%',
              left: '50%',
            }}
          >
            {/* Vertical arm */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: 1,
                height: SPARKLE_ARM_LENGTH * 2,
                transform: 'translate(-50%, -50%)',
                background: `linear-gradient(180deg, transparent, rgba(${AMBER_RGB}, ${SPARKLE_OPACITY}) 40%, rgba(${AMBER_RGB}, ${SPARKLE_OPACITY}) 60%, transparent)`,
                borderRadius: 1,
              }}
            />
            {/* Horizontal arm */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: SPARKLE_ARM_LENGTH * 2,
                height: 1,
                transform: 'translate(-50%, -50%)',
                background: `linear-gradient(90deg, transparent, rgba(${AMBER_RGB}, ${SPARKLE_OPACITY}) 40%, rgba(${AMBER_RGB}, ${SPARKLE_OPACITY}) 60%, transparent)`,
                borderRadius: 1,
              }}
            />
            {/* Center glow dot */}
            <div
              className="hud-filmic-pulse-ring"
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: 6,
                height: 6,
                margin: -3,
                borderRadius: '50%',
                background: `rgba(${AMBER_RGB}, ${SPARKLE_OPACITY * 0.6})`,
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
