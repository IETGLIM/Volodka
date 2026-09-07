/**
 * Post-render frame budget — runs after WebGL draw (priority 1000).
 * Profiler bridges and canvas guards register here via usePostFrameTick().
 */

import { useFrame } from '@react-three/fiber';
import { runPostFrameBudget } from '@/engine/frame/FrameBudgetRegistry';
import { isFrameSimulationActive } from '@/engine/frame/frameVisibility';
import { getLatestFrameGameSnapshot } from '@/engine/frame/frameGameSnapshot';
import { FRAME_PHASE_R3F_PRIORITY } from '@/engine/frame/types';

export function PostFrameBudgetRunner() {
  useFrame((state, delta) => {
    if (!isFrameSimulationActive()) return;

    /* FIX (perf GC): переиспользуем game-снапшот, созданный pre_physics-фазой
     * этого же кадра (FrameBudgetRunner), — без пересоздания объекта и
     * пересчёта locomotion-lock ещё раз за кадр. */
    runPostFrameBudget({
      state,
      delta: Math.min(delta, 0.05),
      game: getLatestFrameGameSnapshot(),
    });
  }, FRAME_PHASE_R3F_PRIORITY.post_render);

  return null;
}
