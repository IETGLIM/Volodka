
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
  /** FIX (perf v4.22): suspend замера, когда канвас не рендерит (demand-фреймлоуп
   *  меню/оверлеев). Раньше rAF-цикл замера жил всегда и жёг кадры впустую,
   *  а среднее FPS в demand-режиме искажалось (кадры рисует только invalidate). */
  enabled?: boolean;
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
    enabled = true,
  } = options;

  const [targetDprMin, targetDprMax] = targetDpr;

  const [dpr, setDpr] = useState<[number, number]>(targetDpr);

  // Ring buffer for O(1) push/trim (replaces Array.shift O(n) pruning)
  const bufferCapacityRef = useRef(Math.max(120, Math.ceil(120 * windowMs / 1000)));
  bufferCapacityRef.current = Math.max(120, Math.ceil(120 * windowMs / 1000));
  // FIX (v4.17.1): два Float64Array вместо Array<{time, fps}> — нулевая
  // аллокация в rAF-цикле (раньше объект аллоцировался каждый кадр,
  // включая demand-фреймлоуп меню).
  const frameTimes = useRef<Float64Array>(new Float64Array(bufferCapacityRef.current));
  const frameFps = useRef<Float64Array>(new Float64Array(bufferCapacityRef.current));
  const writeIndex = useRef(0);
  const readIndex = useRef(0);
  const bufferCount = useRef(0);
  const lastTime = useRef(performance.now());

  // FIX: Stabilization counters to prevent rapid DPR oscillation
  const lowFpsStreak = useRef(0);
  const highFpsStreak = useRef(0);

  // Continuously measure FPS
  useEffect(() => {
    if (!enabled) return;
    const capacity = bufferCapacityRef.current;
    frameTimes.current = new Float64Array(capacity);
    frameFps.current = new Float64Array(capacity);
    writeIndex.current = 0;
    readIndex.current = 0;
    bufferCount.current = 0;

    let rafId: number;
    const measure = () => {
      const now = performance.now();
      const delta = now - lastTime.current;
      lastTime.current = now;
      const fps = delta > 0 ? 1000 / delta : 60;

      const cap = bufferCapacityRef.current;
      frameTimes.current[writeIndex.current] = now;
      frameFps.current[writeIndex.current] = fps;
      writeIndex.current = (writeIndex.current + 1) % cap;
      if (bufferCount.current < cap) {
        bufferCount.current++;
      } else {
        readIndex.current = (readIndex.current + 1) % cap;
      }

      // Prune expired entries from the read side — O(1) amortized per frame
      const cutoff = now - windowMs;
      while (
        bufferCount.current > 0 &&
        frameTimes.current[readIndex.current] < cutoff
      ) {
        readIndex.current = (readIndex.current + 1) % cap;
        bufferCount.current--;
      }

      rafId = requestAnimationFrame(measure);
    };
    rafId = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(rafId);
  }, [windowMs, enabled]);

  // Adjust DPR periodically with stabilization
  useEffect(() => {
    if (!enabled) return;
    const interval = setInterval(() => {
      const count = bufferCount.current;
      if (count < 20) return; // Not enough data yet

      let sum = 0;
      const cap = bufferCapacityRef.current;
      for (let i = 0; i < count; i++) {
        const idx = (readIndex.current + i) % cap;
        sum += frameFps.current[idx];
      }
      const avgFps = sum / count;

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
        } else if (highFpsStreak.current >= stabilizationWindows && prevMax < targetDprMax) {
          // Upgrade — increase max DPR back toward target (stabilized)
          highFpsStreak.current = 0; // Reset after applying
          const newMax = Math.min(
            targetDprMax,
            Math.round((prevMax + step) * 10) / 10,
          );
          return [Math.min(prevMin, newMax), newMax];
        }
        return prev;
      });
    }, windowMs);

    return () => clearInterval(interval);
  }, [lowFpsThreshold, highFpsThreshold, minDpr, step, targetDprMin, targetDprMax, windowMs, stabilizationWindows, enabled]);

  // Re-sync when quality preset changes
  useEffect(() => {
    setDpr([targetDprMin, targetDprMax]);
  }, [targetDprMin, targetDprMax]);

  return dpr;
}
