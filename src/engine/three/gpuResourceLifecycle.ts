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
import { eventBus } from '@/engine/EventBus';

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

/**
 * On WebGL context restore, force-dispose orphaned GL resources so the next
 * render pass rebuilds textures/geometries from scratch instead of referencing
 * now-invalid GL objects. This is a lighter touch than full engine dispose —
 * module-level registries keep their scene ownership, but stale GL handles are
 * dropped so R3F can re-upload them on the next frame.
 *
 * IMPORTANT: Do NOT call THREE.Cache.clear() here. Cache stores all loaded
 * GLB URLs for dedup via useGLTF. Clearing it forces a full re-fetch + re-parse
 * of every GLB in the scene — multi-second stall on Vercel. Three.js re-uploads
 * textures/buffers automatically on context restore; only GL handles need
 * disposal, which forceDisposeOrphanedWebGLResources handles safely.
 */
eventBus.on('canvas:context-restored', () => {
  try {
    forceDisposeOrphanedWebGLResources('gpu-lifecycle:context-restored');
  } catch (err) {
    console.warn('[gpuResourceLifecycle] context-restored cleanup failed:', err);
  }
});
