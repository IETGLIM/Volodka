/**
 * Single R3F useFrame entry point for all budgeted systems.
 * Individual components register via useFrameTick() instead of raw useFrame().
 */

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { runFrameBudget } from '@/engine/frame/FrameBudgetRegistry';
import { resetFrameProfilerCounters } from '@/engine/frame/frameProfilerCounters';

export function FrameBudgetRunner() {
  const frameIndexRef = useRef(0);

  useFrame((state, delta) => {
    resetFrameProfilerCounters();
    frameIndexRef.current += 1;

    runFrameBudget({
      state,
      delta: Math.min(delta, 0.05),
    });
  }, -1000);

  return null;
}
