/* ─── Volodka RPG – Dynamic Crosshair ───
 * Filmic diegetic reticle — restrained marks, no neon scanning ring.
 */

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { eventBus } from '@/engine/EventBus';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';

const STILL_TIMEOUT_MS = 2500;
const SPREAD_MOVING = 10;
const SPREAD_STILL = 5;

export function DynamicCrosshair() {
  const [isMoving, setIsMoving] = useState(false);
  const [nearInteractive, setNearInteractive] = useState(false);
  const lastFootstepRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reducedMotion = useEffectiveReducedMotion();

  useEffect(() => {
    const unsubFootstep = eventBus.on('exploration:footstep', () => {
      lastFootstepRef.current = Date.now();
      setIsMoving((prev) => (prev ? prev : true));
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        if (Date.now() - lastFootstepRef.current >= STILL_TIMEOUT_MS) {
          setIsMoving(false);
        }
      }, STILL_TIMEOUT_MS);
    });

    const unsubHint = eventBus.on('interaction:hint', () => setNearInteractive(true));
    const unsubEnd = eventBus.on('interaction:end', () => setNearInteractive(false));
    const unsubStart = eventBus.on('interaction:start', () => setNearInteractive(false));

    return () => {
      unsubFootstep();
      unsubHint();
      unsubEnd();
      unsubStart();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const spread = isMoving ? SPREAD_MOVING : SPREAD_STILL;
  const ink = nearInteractive
    ? 'rgba(220, 230, 235, 0.92)'
    : 'rgba(214, 211, 209, 0.55)';
  const line = nearInteractive
    ? 'rgba(210, 220, 230, 0.7)'
    : 'rgba(214, 211, 209, 0.28)';

  return (
    <div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
      aria-hidden="true"
    >
      <motion.div
        animate={{
          width: spread * 2 + 4,
          height: spread * 2 + 4,
        }}
        transition={{ duration: reducedMotion ? 0 : 0.28, ease: 'easeOut' }}
        className={nearInteractive ? 'relative hud-filmic-crosshair-ring' : 'relative'}
      >
        <div
          className="dynamic-crosshair-line absolute left-1/2 -translate-x-1/2 bottom-1/2 mb-[3px]"
          style={{ width: 1, height: spread, background: line }}
        />
        <div
          className="dynamic-crosshair-line absolute left-1/2 -translate-x-1/2 top-1/2 mt-[3px]"
          style={{ width: 1, height: spread, background: line }}
        />
        <div
          className="dynamic-crosshair-line absolute top-1/2 -translate-y-1/2 right-1/2 mr-[3px]"
          style={{ width: spread, height: 1, background: line }}
        />
        <div
          className="dynamic-crosshair-line absolute top-1/2 -translate-y-1/2 left-1/2 ml-[3px]"
          style={{ width: spread, height: 1, background: line }}
        />
        <motion.div
          animate={{
            width: nearInteractive ? 3 : 2,
            height: nearInteractive ? 3 : 2,
            backgroundColor: ink,
            boxShadow: nearInteractive
              ? '0 0 4px rgba(220,230,235,0.35)'
              : '0 0 2px rgba(0,0,0,0.4)',
          }}
          transition={{ duration: reducedMotion ? 0 : 0.2 }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        />
      </motion.div>
    </div>
  );
}
