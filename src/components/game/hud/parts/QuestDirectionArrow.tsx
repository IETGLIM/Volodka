/* ─── Volodka RPG – Quest Direction Arrow ───
 * Edge-of-screen indicator arrow that points toward the nearest
 * quest objective waypoint. Uses footstep yaw for direction.
 * Shows a subtle pulsing arrow at the screen edge.
 */

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { eventBus } from '@/engine/EventBus';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';

const ARROW_SIZE = 28;
const UPDATE_INTERVAL_MS = 800;

export function QuestDirectionArrow() {
  const [visible, setVisible] = useState(false);
  const [rotation, setRotation] = useState(0);
  const reducedMotion = useEffectiveReducedMotion();
  const yawRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeRef = useRef(false);

  // Listen for player footstep to track yaw
  useEffect(() => {
    const unsub = eventBus.on('exploration:footstep', (payload) => {
      yawRef.current = payload.yaw;
    });

    // Show arrow when there's an active quest objective hint
    const unsubHint = eventBus.on('interaction:hint', (payload) => {
      if (payload?.type === 'exit') {
        activeRef.current = true;
        setVisible(true);
      }
    });

    const unsubEnd = eventBus.on('interaction:end', () => {
      activeRef.current = false;
      // Don't immediately hide — fade after a bit
      setTimeout(() => {
        if (!activeRef.current) setVisible(false);
      }, 2000);
    });

    return () => {
      unsub();
      unsubHint();
      unsubEnd();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Slowly rotate the arrow based on yaw changes
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      if (!visible || !activeRef.current) return;
      // Use yaw to slightly adjust arrow position
      const deg = ((-yawRef.current * 180) / Math.PI + 360) % 360;
      setRotation(deg);
    }, UPDATE_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [visible]);

  if (reducedMotion || !visible) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.7 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="fixed pointer-events-none"
          style={{
            bottom: 140,
            left: '50%',
            transform: 'translateX(-50%)',
            width: ARROW_SIZE,
            height: ARROW_SIZE,
            zIndex: 9998,
          }}
          aria-hidden="true"
        >
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="relative w-full h-full flex items-center justify-center quest-arrow-bob"
          >
            {/* Upward pointing arrow */}
            <div
              className="absolute"
              style={{
                width: 0,
                height: 0,
                borderLeft: '8px solid transparent',
                borderRight: '8px solid transparent',
                borderBottom: '14px solid rgb(var(--cyber-cyan-rgb) / 0.9)',
                filter: 'drop-shadow(0 0 6px rgb(var(--cyber-cyan-rgb) / 0.6))',
                transform: 'translateY(-3px)',
              }}
            />
            {/* Glow ring behind arrow */}
            <div
              className="absolute inset-0 rounded-full quest-arrow-ring-pulse"
              style={{
                border: '1px solid rgb(var(--cyber-cyan-rgb) / 0.25)',
                background: 'radial-gradient(circle, rgb(var(--cyber-cyan-rgb) / 0.08) 0%, transparent 70%)',
              }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}