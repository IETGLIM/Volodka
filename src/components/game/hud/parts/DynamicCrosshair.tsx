/* ─── Volodka RPG – Dynamic Crosshair ───
 * Enhanced crosshair with dynamic elements:
 * - Crosshair expands when moving
 * - Contracts when standing still
 * - Rotates slowly for a "scanning" effect
 * - Inner dot changes color based on interaction proximity
 */

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { eventBus } from '@/engine/EventBus';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';

const STILL_TIMEOUT_MS = 2500;
const SPREAD_MOVING = 12;
const SPREAD_STILL = 6;

export function DynamicCrosshair() {
  const [isMoving, setIsMoving] = useState(false);
  const [nearInteractive, setNearInteractive] = useState(false);
  const lastFootstepRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rotationRef = useRef(0);
  const rafRef = useRef<number>(0);
  const reducedMotion = useEffectiveReducedMotion();

  useEffect(() => {
    const unsubFootstep = eventBus.on('exploration:footstep', () => {
      lastFootstepRef.current = Date.now();
      setIsMoving(true);
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
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Slow rotation animation
  useEffect(() => {
    if (reducedMotion) return;
    let running = true;
    const tick = () => {
      if (!running) return;
      rotationRef.current += 0.15;
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { running = false; cancelAnimationFrame(rafRef.current); };
  }, [reducedMotion]);

  const spread = isMoving ? SPREAD_MOVING : SPREAD_STILL;
  const dotColor = nearInteractive
    ? 'var(--cyber-cyan)'
    : 'rgba(255, 255, 255, 0.5)';
  const lineColor = nearInteractive
    ? 'rgb(var(--cyber-cyan-rgb) / 0.6)'
    : 'rgba(255, 255, 255, 0.25)';
  const glowStrength = nearInteractive ? 0.4 : 0.1;

  return (
    <div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
      aria-hidden="true"
    >
      {/* Rotating outer ring (subtle) */}
      {!reducedMotion && (
        <motion.div
          animate={{ rotate: rotationRef.current }}
          transition={{ duration: 0.05, ease: 'linear' }}
          className="absolute -inset-5"
          style={{
            border: '1px dashed rgba(255,255,255,0.04)',
            borderRadius: '50%',
          }}
        />
      )}
      {/* Crosshair lines */}
      <motion.div
        animate={{
          width: spread * 2 + 4,
          height: spread * 2 + 4,
        }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="relative"
      >
        {/* Top line */}
        <div
          className="dynamic-crosshair-line absolute left-1/2 -translate-x-1/2 bottom-1/2 mb-[3px]"
          style={{ width: 1, height: spread, background: lineColor, boxShadow: `0 0 ${glowStrength * 8}px ${lineColor}` }}
        />
        {/* Bottom line */}
        <div
          className="dynamic-crosshair-line absolute left-1/2 -translate-x-1/2 top-1/2 mt-[3px]"
          style={{ width: 1, height: spread, background: lineColor, boxShadow: `0 0 ${glowStrength * 8}px ${lineColor}` }}
        />
        {/* Left line */}
        <div
          className="dynamic-crosshair-line absolute top-1/2 -translate-y-1/2 right-1/2 mr-[3px]"
          style={{ width: spread, height: 1, background: lineColor, boxShadow: `0 0 ${glowStrength * 8}px ${lineColor}` }}
        />
        {/* Right line */}
        <div
          className="dynamic-crosshair-line absolute top-1/2 -translate-y-1/2 left-1/2 ml-[3px]"
          style={{ width: spread, height: 1, background: lineColor, boxShadow: `0 0 ${glowStrength * 8}px ${lineColor}` }}
        />
        {/* Center dot */}
        <motion.div
          animate={{
            width: nearInteractive ? 4 : 2,
            height: nearInteractive ? 4 : 2,
            backgroundColor: dotColor,
            boxShadow: nearInteractive
              ? '0 0 6px var(--cyber-cyan), 0 0 12px rgb(var(--cyber-cyan-rgb) / 0.3)'
              : '0 0 3px rgba(255,255,255,0.3)',
          }}
          transition={{ duration: 0.2 }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        />
      </motion.div>
    </div>
  );
}