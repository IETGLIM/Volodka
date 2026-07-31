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

  useEffect(() => {
    const unsubEnter = eventBus.on('scene:enter', ({ sceneId }) => {
      disposeRendererShadowMaps(gl, scene);
      preloadSceneGpuAssets(sceneId);
      preloadSceneJsChunks(sceneId);
    });

    return () => {
      unsubEnter();
    };
  }, [gl, scene]);

  return null;
}
