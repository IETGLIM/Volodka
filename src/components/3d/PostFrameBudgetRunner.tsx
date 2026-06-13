/**
 * Post-render frame budget — runs after WebGL draw (priority 1000).
 * Profiler bridges and canvas guards register here via useFrameTick({ phase: 'post' }).
 */

import { useFrame } from '@react-three/fiber';
import { getGameStore } from '@/store/gameStore';
import { runPostFrameBudget } from '@/engine/frame/FrameBudgetRegistry';
import { createFrameGameSnapshotFromStore } from '@/engine/frame/frameGameSnapshot';

export function PostFrameBudgetRunner() {
  useFrame((state, delta) => {
    runPostFrameBudget({
      state,
      delta: Math.min(delta, 0.05),
      game: createFrameGameSnapshotFromStore(getGameStore()),
    });
  }, 1000);

  return null;
}
