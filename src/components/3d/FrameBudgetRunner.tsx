/**
 * Pre-draw frame budget orchestrator — one R3F useFrame per pipeline phase.
 * Soft-skips non-critical ticks when cumulative work exceeds FRAME_BUDGET_MS
 * (critical: interaction / player / npc / camera — see types.ts).
 * Rapier physics steps at FRAME_PHYSICS_R3F_PRIORITY (0) between pre/post physics.
 * Post-render ticks run via PostFrameBudgetRunner (+1000) and are never skipped.
 * Components register via useFrameTick() / usePostFrameTick().
 */

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { getGameSnapshot } from '@/engine/StateDispatcher';
import { runFrameBudgetForPhase } from '@/engine/frame/FrameBudgetRegistry';
import { isFrameSimulationActive } from '@/engine/frame/frameVisibility';
import {
  createFrameGameSnapshot,
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
    if (!isFrameSimulationActive()) return;

    resetFrameProfilerCounters();
    frameIndexRef.current += 1;
    frameCtxRef.current = {
      state,
      delta: Math.min(delta, 0.05),
      game: createFrameGameSnapshot(getGameSnapshot()),
    };
    runFrameBudgetForPhase(frameCtxRef.current, 'pre_physics');
  }, FRAME_PHASE_R3F_PRIORITY.pre_physics);

  useFrame((state, delta) => {
    if (!isFrameSimulationActive()) return;

    frameCtxRef.current = {
      ...frameCtxRef.current,
      state,
      delta: Math.min(delta, 0.05),
    };
    runFrameBudgetForPhase(frameCtxRef.current, 'post_physics');
  }, FRAME_PHASE_R3F_PRIORITY.post_physics);

  useFrame((state, delta) => {
    if (!isFrameSimulationActive()) return;

    frameCtxRef.current = {
      ...frameCtxRef.current,
      state,
      delta: Math.min(delta, 0.05),
    };
    runFrameBudgetForPhase(frameCtxRef.current, 'pre_render');
  }, FRAME_PHASE_R3F_PRIORITY.pre_render);

  return null;
}
