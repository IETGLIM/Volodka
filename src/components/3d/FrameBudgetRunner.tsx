/**
 * Pre-draw frame budget orchestrator — one R3F useFrame per pipeline phase.
 * Rapier physics steps at FRAME_PHYSICS_R3F_PRIORITY (0) between pre/post physics.
 * Post-render ticks run via PostFrameBudgetRunner (+1000).
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

/**
 * FIX P0 #4: Sanitize the R3F-provided delta before any consumer sees it.
 * On tab-switch / first frame after visibility restore / WebGL context loss,
 * R3F (or the browser) can hand us `delta = 0`, `NaN`, `Infinity`, or even a
 * negative value. Without this guard, `NaN` propagates into camera math
 * (FollowCamera.tsx:229 and similar), producing a black screen that only a
 * full page reload recovers from.
 *
 * We clamp to a safe `[0, 0.05]` range (max 50ms = ~20 FPS minimum step).
 * `1 / 60` is the canonical fallback when the input is not a finite positive
 * number — this matches R3F's own default delta and keeps motion steady.
 */
function sanitizeDelta(raw: number): number {
  if (!Number.isFinite(raw) || raw <= 0) return 1 / 60;
  return Math.min(raw, 0.05);
}

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
      delta: sanitizeDelta(delta),
      game: createFrameGameSnapshot(getGameSnapshot()),
    };
    runFrameBudgetForPhase(frameCtxRef.current, 'pre_physics');
  }, FRAME_PHASE_R3F_PRIORITY.pre_physics);

  useFrame((state, delta) => {
    if (!isFrameSimulationActive()) return;

    frameCtxRef.current = {
      ...frameCtxRef.current,
      state,
      delta: sanitizeDelta(delta),
    };
    runFrameBudgetForPhase(frameCtxRef.current, 'post_physics');
  }, FRAME_PHASE_R3F_PRIORITY.post_physics);

  useFrame((state, delta) => {
    if (!isFrameSimulationActive()) return;

    frameCtxRef.current = {
      ...frameCtxRef.current,
      state,
      delta: sanitizeDelta(delta),
    };
    runFrameBudgetForPhase(frameCtxRef.current, 'pre_render');
  }, FRAME_PHASE_R3F_PRIORITY.pre_render);

  return null;
}
