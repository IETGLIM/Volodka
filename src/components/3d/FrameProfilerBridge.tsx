/**
 * End-of-frame profiler — GPU stats + budget publish.
 * Replaces RendererInfoBridge with extended frame budget metrics.
 */

import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { setFrameBudgetProfilingArmed } from '@/engine/frame/FrameBudgetRegistry';
import { usePostFrameTick } from '@/engine/frame/useFrameTick';
import { publishFrameProfiler, getFrameProfilerSnapshot } from '@/engine/frame/FrameProfilerState';
import { publishRuntimeBudgetCheck } from '@/engine/performance/RuntimeBudgetMonitor';
import { publishGpuRendererSnapshot } from '@/engine/performance/GpuResourceBudgetTracker';
import { useGameStore } from '@/store/gameStore';
import type { SceneId } from '@/shared/types/game';

export function FrameProfilerBridge() {
  const gl = useThree((state) => state.gl);
  const dpr = useThree((state) => state.viewport.dpr);
  const lastFrameTimeRef = useRef(performance.now());
  const frameNumberRef = useRef(0);

  useEffect(() => {
    setFrameBudgetProfilingArmed(true);
    return () => setFrameBudgetProfilingArmed(false);
  }, []);

  usePostFrameTick(
    'misc',
    () => {
      const now = performance.now();
      const cpuFrameMs = now - lastFrameTimeRef.current;
      lastFrameTimeRef.current = now;
      frameNumberRef.current += 1;

      const info = gl.info;
      publishGpuRendererSnapshot({
        geometryCount: info.memory.geometries,
        textureCount: info.memory.textures,
        triangleCount: info.render.triangles,
      });
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
    },
    { label: 'FrameProfiler', priority: 1000 },
  );

  return null;
}
