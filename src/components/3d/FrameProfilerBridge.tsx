/**
 * End-of-frame profiler — GPU stats + budget publish.
 * Replaces RendererInfoBridge with extended frame budget metrics.
 */

import { useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { publishFrameProfiler, getFrameProfilerSnapshot } from '@/engine/frame/FrameProfilerState';
import { publishRuntimeBudgetCheck } from '@/engine/performance/RuntimeBudgetMonitor';
import { useGameStore } from '@/store/gameStore';
import type { SceneId } from '@/shared/types/game';

export function FrameProfilerBridge() {
  const gl = useThree((state) => state.gl);
  const dpr = useThree((state) => state.viewport.dpr);
  const lastFrameTimeRef = useRef(performance.now());
  const frameNumberRef = useRef(0);

  useFrame(() => {
    const now = performance.now();
    const cpuFrameMs = now - lastFrameTimeRef.current;
    lastFrameTimeRef.current = now;
    frameNumberRef.current += 1;

    const info = gl.info;
    publishFrameProfiler({
      frameNumber: frameNumberRef.current,
      cpuFrameMs,
      drawCalls: info.render.calls,
      triangles: info.render.triangles,
      textures: info.memory.textures,
      geometries: info.memory.geometries,
      programs: info.programs?.length ?? 0,
      dpr,
    });

    const sceneId = useGameStore.getState().exploration.currentSceneId as SceneId;
    publishRuntimeBudgetCheck(getFrameProfilerSnapshot(), sceneId);
  }, 1000);

  return null;
}
