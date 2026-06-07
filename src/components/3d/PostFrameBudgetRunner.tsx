/**
 * Post-render frame budget — runs after WebGL draw (priority 1000).
 * Profiler bridges and canvas guards register here via useFrameTick({ phase: 'post' }).
 */

import { useFrame } from '@react-three/fiber';
import { runPostFrameBudget } from '@/engine/frame/FrameBudgetRegistry';

export function PostFrameBudgetRunner() {
  useFrame((state, delta) => {
    runPostFrameBudget({
      state,
      delta: Math.min(delta, 0.05),
    });
  }, 1000);

  return null;
}
