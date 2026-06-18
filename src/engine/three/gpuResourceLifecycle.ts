/**
 * Central GPU resource teardown for engine dispose and Vite HMR.
 * Does not tear down engine singletons (EventBus, audio) — GPU caches and pools only.
 */

import * as THREE from 'three';
import { resetGltfPipeline } from '@/engine/assets/gltfPipeline';
import { resetGltfPreloadQueue } from '@/engine/assets/gltfPreloadScheduler';
import {
  forceDisposeOrphanedWebGLResources,
  resetCanvasRendererRegistry,
} from '@/engine/canvas/canvasRendererRegistry';
import { disposeCombatTransientPools } from '@/engine/combat/combatTransientPool';
import {
  evictQualityDependentGpuCache,
  resetQualityGpuCleanupListener,
} from '@/engine/graphics/graphicsGpuCleanup';
import { registerHmrBeforeUpdate, registerHmrDispose } from '@/shared/dev/hmrDispose';
import { disposeAllModuleGeometries } from '@/engine/three/moduleGeometryRegistry';
import { disposeAllModuleMaterials } from '@/engine/three/moduleMaterialRegistry';
import { resetGpuResourceBudgetTracker } from '@/engine/performance/GpuResourceBudgetTracker';

export type GpuDisposeReason = 'engine' | 'hmr';

const gpuHmrHandlers = new Set<() => void>();

/** Register an extra GPU cleanup handler (runs on HMR and full engine GPU dispose). */
export function registerGpuHmrHandler(handler: () => void): () => void {
  gpuHmrHandlers.add(handler);
  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      gpuHmrHandlers.delete(handler);
    });
  }
  return () => {
    gpuHmrHandlers.delete(handler);
  };
}

/** Test-only reset */
export function resetGpuHmrHandlersForTests(): void {
  gpuHmrHandlers.clear();
}

function runRegisteredGpuHandlers(reason: GpuDisposeReason): void {
  for (const handler of gpuHmrHandlers) {
    try {
      handler();
    } catch (err) {
      console.warn(`[gpuResourceLifecycle] handler failed (${reason}):`, err);
    }
  }
}

/** Tear down module-level GPU caches, pools, and loader state. */
export function disposeAllEngineGpuResources(reason: GpuDisposeReason = 'engine'): void {
  if (reason === 'engine') {
    try {
      forceDisposeOrphanedWebGLResources(`gpu-lifecycle:${reason}`);
    } catch (err) {
      console.warn('[gpuResourceLifecycle] forceDisposeOrphanedWebGLResources failed:', err);
    }
  }

  disposeCombatTransientPools();
  disposeAllModuleMaterials();
  disposeAllModuleGeometries();
  resetGpuResourceBudgetTracker();
  evictQualityDependentGpuCache();
  THREE.Cache.clear();
  resetGltfPipeline();
  resetGltfPreloadQueue();

  if (reason === 'hmr') {
    resetCanvasRendererRegistry();
    resetQualityGpuCleanupListener();
  }

  runRegisteredGpuHandlers(reason);
}

function disposeGpuResourcesForHmr(): void {
  disposeAllEngineGpuResources('hmr');
}

registerHmrBeforeUpdate(disposeGpuResourcesForHmr);
registerHmrDispose(disposeGpuResourcesForHmr);
