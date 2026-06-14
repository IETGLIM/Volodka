/**
 * Scene-chunk GPU lifecycle — ties lazy chunk modules into Vite HMR teardown.
 * Imported from lazySceneChunk so any scene sub-chunk load registers cleanup.
 */

import { registerHmrBeforeUpdate, registerHmrDispose } from '@/shared/dev/hmrDispose';
import { disposeAllModuleGeometries } from '@/engine/three/moduleGeometryRegistry';
import { disposeAllModuleMaterials } from '@/engine/three/moduleMaterialRegistry';

function disposeSceneChunkSharedGpuForHmr(): void {
  disposeAllModuleMaterials();
  disposeAllModuleGeometries();
}

registerHmrBeforeUpdate(disposeSceneChunkSharedGpuForHmr);
registerHmrDispose(disposeSceneChunkSharedGpuForHmr);
