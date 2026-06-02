'use client';

/* ─── Volodka RPG – Dynamic DPR scaling hook ─── */

import { useState, useEffect, useRef } from 'react';

export interface DynamicDPROptions {
  /** Target DPR range from quality preset [min, max] */
  targetDpr: [number, number];
  /** FPS threshold below which DPR is reduced */
  lowFpsThreshold?: number;
  /** FPS threshold above which DPR is increased */
  highFpsThreshold?: number;
  /** Minimum DPR value (won't go below this) */
  minDpr?: number;
  /** Step size for DPR adjustments */
  step?: number;
  /** How often (ms) to evaluate and potentially adjust DPR */
  windowMs?: number;
  /** FIX (Code Review #5): Number of consecutive low/high FPS windows required
   *  before adjusting DPR. Prevents rapid oscillation (flickering) when FPS
   *  hovers near a threshold. Default: 2 (must see 2 consecutive windows
   *  of low/high FPS before changing). */
  stabilizationWindows?: number;
}

/**
 * Measures FPS via requestAnimationFrame and dynamically adjusts
 * the Canvas DPR to maintain smooth performance.
 *
 * Returns the current [min, max] DPR tuple to pass to `<Canvas dpr={...}>`.
 *
 * Algorithm:
 *  - Every `windowMs` ms, compute average FPS over the last ~120 frames.
 *  - If avgFps < lowFpsThreshold → reduce max DPR by `step`.
 *  - If avgFps > highFpsThreshold → increase max DPR by `step` (up to target max).
 *  - Never go below `minDpr`.
 *
 * FIX (Code Review #5): Added stabilization counter to prevent DPR flickering.
 * DPR changes only after `stabilizationWindows` consecutive evaluation windows
 * agree on the direction. A single spike/dip won't trigger a DPR change,
 * preventing the visual flickering that could occur on borderline hardware.
 */
export function useDynamicDPR(options: DynamicDPROptions): [number, number] {
  const {
    targetDpr,
    lowFpsThreshold = 25,
    highFpsThreshold = 45,
    minDpr = 0.75,
    step = 0.1,
    windowMs = 2000,
    stabilizationWindows = 2,
  } = options;

  const [dpr, setDpr] = useState<[number, number]>(targetDpr);

  // Store timestamp+fps pairs for rolling window
  const frameBuffer = useRef<Array<{ time: number; fps: number }>>([]);
  const lastTime = useRef(performance.now());

  // FIX: Stabilization counters to prevent rapid DPR oscillation
  const lowFpsStreak = useRef(0);
  const highFpsStreak = useRef(0);

  // Continuously measure FPS
  useEffect(() => {
    let rafId: number;
    const measure = () => {
      const now = performance.now();
      const delta = now - lastTime.current;
      lastTime.current = now;
      const fps = delta > 0 ? 1000 / delta : 60;

      frameBuffer.current.push({ time: now, fps });

      // Prune old entries outside the measurement window
      const cutoff = now - windowMs;
      while (
        frameBuffer.current.length > 0 &&
        frameBuffer.current[0].time < cutoff
      ) {
        frameBuffer.current.shift();
      }

      rafId = requestAnimationFrame(measure);
    };
    rafId = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(rafId);
  }, [windowMs]);

  // Adjust DPR periodically with stabilization
  useEffect(() => {
    const interval = setInterval(() => {
      const buffer = frameBuffer.current;
      if (buffer.length < 20) return; // Not enough data yet

      const avgFps = buffer.reduce((sum, e) => sum + e.fps, 0) / buffer.length;

      // FIX: Track consecutive windows before adjusting DPR
      if (avgFps < lowFpsThreshold) {
        lowFpsStreak.current++;
        highFpsStreak.current = 0;
      } else if (avgFps > highFpsThreshold) {
        highFpsStreak.current++;
        lowFpsStreak.current = 0;
      } else {
        // FPS is in the "good" range — reset both streaks
        lowFpsStreak.current = 0;
        highFpsStreak.current = 0;
      }

      // Only adjust DPR after enough consecutive windows agree
      setDpr((prev) => {
        const [prevMin, prevMax] = prev;

        if (lowFpsStreak.current >= stabilizationWindows && prevMax > minDpr) {
          // Downgrade — reduce max DPR (stabilized)
          lowFpsStreak.current = 0; // Reset after applying
          const newMax = Math.max(minDpr, Math.round((prevMax - step) * 10) / 10);
          return [Math.min(prevMin, newMax), newMax];
        } else if (highFpsStreak.current >= stabilizationWindows && prevMax < targetDpr[1]) {
          // Upgrade — increase max DPR back toward target (stabilized)
          highFpsStreak.current = 0; // Reset after applying
          const newMax = Math.min(
            targetDpr[1],
            Math.round((prevMax + step) * 10) / 10,
          );
          return [Math.min(prevMin, newMax), newMax];
        }
        return prev;
      });
    }, windowMs);

    return () => clearInterval(interval);
  }, [lowFpsThreshold, highFpsThreshold, minDpr, step, targetDpr, windowMs, stabilizationWindows]);

  return dpr;
}
