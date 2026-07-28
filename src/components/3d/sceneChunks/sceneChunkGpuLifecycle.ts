/**
 * Scene-chunk GPU lifecycle — scene:unload disposal + Vite HMR teardown.
 * Boot via bindSceneChunkGpuLifecycle() (reviveGameEngine), not import-time.
 */

import { eventBus } from '@/engine/EventBus';
import { registerHmrBeforeUpdate, registerHmrDispose } from '@/shared/dev/hmrDispose';
import { disposeAllModuleGeometries } from '@/engine/three/moduleGeometryRegistry';
import { disposeAllModuleMaterials } from '@/engine/three/moduleMaterialRegistry';
import { unloadSceneGpuResources } from '@/engine/three/unloadSceneGpuResources';
import { resolveDerivedSceneId } from '@/config/sceneInheritance';
import type { SceneId } from '@/shared/types/game';

let unsubSceneUnload: (() => void) | null = null;

function disposeAllSceneChunkGpuForHmr(): void {
  disposeAllModuleMaterials();
  disposeAllModuleGeometries();
}

/** Pure guard — derived variants share parent GPU pools and must not unload mid-hop. */
export function shouldUnloadSceneGpuOnTransition(
  sceneId: SceneId,
  nextSceneId: SceneId,
): boolean {
  if (sceneId === nextSceneId) return false;
  return resolveDerivedSceneId(sceneId) !== resolveDerivedSceneId(nextSceneId);
}

function onSceneUnload({ sceneId, nextSceneId }: { sceneId: SceneId; nextSceneId: SceneId }): void {
  if (!shouldUnloadSceneGpuOnTransition(sceneId, nextSceneId)) return;
  unloadSceneGpuResources(resolveDerivedSceneId(sceneId));
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
