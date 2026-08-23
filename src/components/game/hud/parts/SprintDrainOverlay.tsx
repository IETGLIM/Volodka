/* ─── Volodka RPG – Sprint Drain Overlay ───
 * Full-screen vignette overlay that appears during sprinting.
 * Shows subtle directional speed lines and a faint amber/rose tint
 * to communicate energy consumption. Fades in/out smoothly.
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { eventBus } from '@/engine/EventBus';
import { isPlayerSprintDraining } from '@/engine/player/playerStamina';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { UI_LAYERS } from '@/shared/constants/uiLayers';

const SPRINT_TIMEOUT_MS = 1200;

export function SprintDrainOverlay() {
  const [isSprinting, setIsSprinting] = useState(false);
  const lastFootstepRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reducedMotion = useEffectiveReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;

    const unsub = eventBus.on('exploration:footstep', (_payload) => {
      const now = Date.now();
      // Sprint = footsteps closer than 350ms apart
      const gap = now - lastFootstepRef.current;
      if (gap < 350 && gap > 50) {
        setIsSprinting((prev) => (prev ? prev : true));
      }
      lastFootstepRef.current = now;
    });

    // Check for sprint timeout
    intervalRef.current = setInterval(() => {
      // Стамина реально утекает — спринт активен. Это надёжнее каданса шагов
      // (шаги замедляются при исчерпании стамины, а тут сигнал точный).
      if (isPlayerSprintDraining()) {
        setIsSprinting((prev) => (prev ? prev : true));
        return;
      }
      if (Date.now() - lastFootstepRef.current > SPRINT_TIMEOUT_MS) {
        setIsSprinting((prev) => (prev ? false : prev));
      }
    }, 200);

    return () => {
      unsub();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [reducedMotion]);

  if (reducedMotion) return null;

  return (
    <AnimatePresence>
      {isSprinting && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed inset-0 pointer-events-none"
          style={{ zIndex: UI_LAYERS.HUD }}
          aria-hidden="true"
        >
          {/* Amber-rose vignette tint for energy drain — with filmic vignette pulse */}
          <div
            className="absolute inset-0 sprint-drain-vignette hud-filmic-vignette-pulse"
            style={{
              background: 'radial-gradient(ellipse at center, transparent 50%, rgba(251, 146, 60, 0.04) 70%, rgba(244, 63, 94, 0.06) 100%)',
            }}
          />
          {/* Speed lines — top and bottom edges */}
          <div className="absolute top-0 left-0 right-0 h-16 overflow-hidden pointer-events-none">
            <div className="sprint-speed-line-top absolute inset-0" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-16 overflow-hidden pointer-events-none">
            <div className="sprint-speed-line-bottom absolute inset-0" />
          </div>
          {/* Subtle screen-edge pulse */}
          <div
            className="absolute inset-0 sprint-edge-pulse"
            style={{
              boxShadow: 'inset 0 0 60px rgba(251, 146, 60, 0.06), inset 0 0 120px rgba(244, 63, 94, 0.03)',
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}