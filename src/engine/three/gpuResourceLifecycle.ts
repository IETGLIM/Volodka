/**
 * Central GPU resource teardown for engine dispose and Vite HMR.
 * Does not tear down engine singletons (EventBus, audio) — GPU caches and pools only.
 */

import { Cache } from 'three';
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
import { disposeProceduralLutCache } from '@/engine/graphics/proceduralLutTextures';
import { resetGpuResourceBudgetTracker } from '@/engine/performance/GpuResourceBudgetTracker';

import { devWarn } from '@/shared/utils/devLog';
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
      devWarn(`[gpuResourceLifecycle] handler failed (${reason}):`, err);
    }
  }
}

/** Tear down module-level GPU caches, pools, and loader state. */
export function disposeAllEngineGpuResources(reason: GpuDisposeReason = 'engine'): void {
  if (reason === 'engine') {
    try {
      forceDisposeOrphanedWebGLResources(`gpu-lifecycle:${reason}`);
    } catch (err) {
      devWarn('[gpuResourceLifecycle] forceDisposeOrphanedWebGLResources failed:', err);
    }
  }

  disposeCombatTransientPools();
  disposeAllModuleMaterials();
  disposeAllModuleGeometries();
  disposeProceduralLutCache();
  resetGpuResourceBudgetTracker();
  evictQualityDependentGpuCache();
  Cache.clear();
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

/**
 * Compatibility lifecycle hooks retained for engine init/dispose callers.
 * A restored context still belongs to the live R3F root: Three.js recreates its
 * GL handles, so teardown here would dispose the active renderer and scene.
 */
export function bindGpuContextRestoreListener(): void {
  // Recovery is owned by CanvasGuardSystem. Destructive disposal remains
  // reserved for full engine teardown and error-boundary orphan cleanup.
}

export function unbindGpuContextRestoreListener(): void {
  // No global listener is installed.
}

bindGpuContextRestoreListener();
