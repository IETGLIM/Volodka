/**
 * Pre-draw frame budget orchestrator — one R3F useFrame per pipeline phase.
 * Rapier physics steps at FRAME_PHYSICS_R3F_PRIORITY (0) between pre/post physics.
 * Post-render ticks run via PostFrameBudgetRunner (+1000).
 * Components register via useFrameTick() / usePostFrameTick().
 */

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { getGameStore } from '@/store/gameStore';
import { runFrameBudgetForPhase } from '@/engine/frame/FrameBudgetRegistry';
import {
  createFrameGameSnapshotFromStore,
  DEFAULT_FRAME_GAME_SNAPSHOT,
} from '@/engine/frame/frameGameSnapshot';
import { resetFrameProfilerCounters } from '@/engine/frame/frameProfilerCounters';
import {
  FRAME_PHASE_R3F_PRIORITY,
  type FrameTickContext,
} from '@/engine/frame/types';

export function FrameBudgetRunner() {
  const frameIndexRef = useRef(0);
  const frameCtxRef = useRef<FrameTickContext>({
    state: {} as FrameTickContext['state'],
    delta: 1 / 60,
    game: DEFAULT_FRAME_GAME_SNAPSHOT,
  });

  useFrame((state, delta) => {
    resetFrameProfilerCounters();
    frameIndexRef.current += 1;
    frameCtxRef.current = {
      state,
      delta: Math.min(delta, 0.05),
      game: createFrameGameSnapshotFromStore(getGameStore()),
    };
    runFrameBudgetForPhase(frameCtxRef.current, 'pre_physics');
  }, FRAME_PHASE_R3F_PRIORITY.pre_physics);

  useFrame((state, delta) => {
    frameCtxRef.current = {
      ...frameCtxRef.current,
      state,
      delta: Math.min(delta, 0.05),
    };
    runFrameBudgetForPhase(frameCtxRef.current, 'post_physics');
  }, FRAME_PHASE_R3F_PRIORITY.post_physics);

  useFrame((state, delta) => {
    frameCtxRef.current = {
      ...frameCtxRef.current,
      state,
      delta: Math.min(delta, 0.05),
    };
    runFrameBudgetForPhase(frameCtxRef.current, 'pre_render');
  }, FRAME_PHASE_R3F_PRIORITY.pre_render);

  return null;
}
