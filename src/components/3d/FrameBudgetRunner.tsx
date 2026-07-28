/**
 * Pre-render frame budget orchestrator (priority −1000).
 * Soft-skips non-critical ticks when cumulative work exceeds FRAME_BUDGET_MS
 * (critical: interaction / player / npc / camera — see types.ts).
 * Post-render ticks run via PostFrameBudgetRunner (+1000) and are never skipped.
 * Components register via useFrameTick() / usePostFrameTick().
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
