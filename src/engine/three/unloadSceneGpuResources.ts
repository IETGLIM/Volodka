/**
 * Unified scene:unload GPU teardown for module-level procedural caches.
 */

import type { SceneId } from '@/shared/types/game';
import { unloadSceneGpuOwnership } from '@/engine/three/sceneGpuOwnership';
import { disposeRegisteredModuleGeometry } from '@/engine/three/moduleGeometryRegistry';
import { disposeRegisteredModuleMaterial } from '@/engine/three/moduleMaterialRegistry';
import { markSceneModuleGpuPoolsDisposed } from '@/engine/three/sceneModuleGpu';

/** Release refcounted scene-scoped module geometries and materials. */
export function unloadSceneGpuResources(sceneId: SceneId): void {
  unloadSceneGpuOwnership(sceneId, {
    disposeGeometry: disposeRegisteredModuleGeometry,
    disposeMaterial: disposeRegisteredModuleMaterial,
  });
  markSceneModuleGpuPoolsDisposed(sceneId);
}
