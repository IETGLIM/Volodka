/* ─── Evict prior scene GLB cache on unload; preload next on enter ─── */

import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';

import { eventBus } from '@/engine/EventBus';
import { disposeRendererShadowMaps } from '@/engine/three/disposeThreeResources';
import {
  evictSceneGpuCache,
  preloadSceneGpuAssets,
} from '@/engine/scene/sceneGpuLifecycle';
import { preloadSceneJsChunks } from '@/components/3d/sceneChunks/sceneChunkRegistry';

export function SceneGpuLifecycleBridge() {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);

  useEffect(() => {
    const unsubUnload = eventBus.on('scene:unload', ({ sceneId, nextSceneId }) => {
      if (sceneId !== nextSceneId) {
        evictSceneGpuCache(sceneId, nextSceneId);
      }
    });

    const unsubEnter = eventBus.on('scene:enter', ({ sceneId }) => {
      disposeRendererShadowMaps(gl, scene);
      preloadSceneGpuAssets(sceneId);
      preloadSceneJsChunks(sceneId);
    });

    return () => {
      unsubUnload();
      unsubEnter();
    };
  }, [gl, scene]);

  return null;
}
