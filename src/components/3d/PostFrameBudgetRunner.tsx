/**
 * Post-render frame budget — runs after WebGL draw (priority 1000).
 * Profiler bridges and canvas guards register here via usePostFrameTick().
 */

import { useFrame } from '@react-three/fiber';
import { getGameStore } from '@/store/gameStore';
import { runPostFrameBudget } from '@/engine/frame/FrameBudgetRegistry';
import { createFrameGameSnapshotFromStore } from '@/engine/frame/frameGameSnapshot';
import { FRAME_PHASE_R3F_PRIORITY } from '@/engine/frame/types';

export function PostFrameBudgetRunner() {
  useFrame((state, delta) => {
    runPostFrameBudget({
      state,
      delta: Math.min(delta, 0.05),
      game: createFrameGameSnapshotFromStore(getGameStore()),
    });
  }, FRAME_PHASE_R3F_PRIORITY.post_render);

  return null;
}
