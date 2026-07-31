/**
 * Scene-chunk GPU lifecycle — scene:unload disposal + Vite HMR teardown.
 * Boot via bindSceneChunkGpuLifecycle() (reviveGameEngine), not import-time.
 *
 * Unload ownership + GLTF eviction live in `releaseSceneGpuOnUnload`
 * (`sceneGpuLifecycle`) — this module only binds the EventBus + HMR hooks.
 */

import { eventBus } from '@/engine/EventBus';
import {
  releaseSceneGpuOnUnload,
  shouldUnloadSceneGpuOnTransition,
} from '@/engine/scene/sceneGpuLifecycle';
import { disposeAllModuleGeometries } from '@/engine/three/moduleGeometryRegistry';
import { disposeAllModuleMaterials } from '@/engine/three/moduleMaterialRegistry';
import { registerHmrBeforeUpdate, registerHmrDispose } from '@/shared/dev/hmrDispose';
import type { SceneId } from '@/shared/types/game';

export { shouldUnloadSceneGpuOnTransition };

let unsubSceneUnload: (() => void) | null = null;

function disposeAllSceneChunkGpuForHmr(): void {
  disposeAllModuleMaterials();
  disposeAllModuleGeometries();
}

function onSceneUnload({ sceneId, nextSceneId }: { sceneId: SceneId; nextSceneId: SceneId }): void {
  releaseSceneGpuOnUnload(sceneId, nextSceneId);
}

/** Idempotent — subscribe to scene:unload for module-level GPU cache eviction. */
export function bindSceneChunkGpuLifecycle(): void {
  unbindSceneChunkGpuLifecycle();
  unsubSceneUnload = eventBus.on('scene:unload', onSceneUnload);
}

export function unbindSceneChunkGpuLifecycle(): void {
  unsubSceneUnload?.();
  unsubSceneUnload = null;
}

registerHmrBeforeUpdate(disposeAllSceneChunkGpuForHmr);
registerHmrDispose(disposeAllSceneChunkGpuForHmr);
