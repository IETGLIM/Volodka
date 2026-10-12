/* ─── Preload next scene GPU assets on enter (unload owned by sceneGpuLifecycle) ─── */

import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';

import { eventBus } from '@/engine/EventBus';
import { disposeRendererShadowMaps } from '@/engine/three/disposeThreeResources';
import { preloadSceneGpuAssets } from '@/engine/scene/sceneGpuLifecycle';
import { preloadSceneJsChunks } from '@/components/3d/sceneChunks/sceneChunkRegistry';

/**
 * Canvas-scoped enter warm-up. Scene:unload teardown is
 * `releaseSceneGpuOnUnload` via `bindSceneChunkGpuLifecycle` — do not ad-hoc
 * dispose module caches here.
 */
export function SceneGpuLifecycleBridge() {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const camera = useThree((state) => state.camera);

  useEffect(() => {
    let warmupCleanup: (() => void) | null = null;

    const unsubEnter = eventBus.on('scene:enter', ({ sceneId }) => {
      disposeRendererShadowMaps(gl, scene);
      preloadSceneGpuAssets(sceneId);
      preloadSceneJsChunks(sceneId);
    });

    /* PERF FIX (v4.48): прогрев шейдеров при загрузке сцены. gl.compile()
     * прекомпилирует все GPU-программы сцены, пока переходная вуаль ещё
     * закрыта — убирает классический хитч первого кадра (появление новой
     * сцены = новые материалы + тени = компиляция шейдеров в игре). */
    const unsubLoaded = eventBus.on('scene:loaded', () => {
      const warmup = () => {
        try {
          gl.compile(scene, camera);
        } catch {
          /* context lost during warmup — ignore */
        }
      };
      // Двойной rAF: даём смонтироваться компонентам сцены, чтобы
      // compile() увидел все материалы.
      const raf1 = requestAnimationFrame(() => {
        const raf2 = requestAnimationFrame(warmup);
        rafCleanup = () => cancelAnimationFrame(raf2);
      });
      let rafCleanup: (() => void) | null = null;
      warmupCleanup = () => {
        cancelAnimationFrame(raf1);
        rafCleanup?.();
        rafCleanup = null;
      };
    });

    return () => {
      unsubEnter();
      unsubLoaded();
      warmupCleanup?.();
      warmupCleanup = null;
    };
  }, [gl, scene, camera]);

  return null;
}
