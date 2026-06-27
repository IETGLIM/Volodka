/**
 * Post-render frame budget — runs after WebGL draw (priority 1000).
 * Profiler bridges and canvas guards register here via usePostFrameTick().
 */

import { useFrame } from '@react-three/fiber';
import { getGameSnapshot } from '@/engine/StateDispatcher';
import { runPostFrameBudget } from '@/engine/frame/FrameBudgetRegistry';
import { isFrameSimulationActive } from '@/engine/frame/frameVisibility';
import { createFrameGameSnapshot } from '@/engine/frame/frameGameSnapshot';
import { FRAME_PHASE_R3F_PRIORITY } from '@/engine/frame/types';

/** FIX P0 #4: Same NaN/Infinity guard as FrameBudgetRunner.sanitizeDelta.
 *  See that file for the rationale — we don't want post-render ticks
 *  (profiler, canvas guards) to crash on a bad delta after a tab-switch. */
function sanitizePostDelta(raw: number): number {
  if (!Number.isFinite(raw) || raw <= 0) return 1 / 60;
  return Math.min(raw, 0.05);
}

export function PostFrameBudgetRunner() {
  useFrame((state, delta) => {
    if (!isFrameSimulationActive()) return;

    runPostFrameBudget({
      state,
      delta: sanitizePostDelta(delta),
      game: createFrameGameSnapshot(getGameSnapshot()),
    });
  }, FRAME_PHASE_R3F_PRIORITY.post_render);

  return null;
}
