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
 *
 * FIX P0 #6: also dispose module-level geometry/material registries. The
 * original listener only ran `forceDisposeOrphanedWebGLResources`, which
 * disposes renderer-tracked orphans but skips the shared singleton geometries
 * and materials in `moduleGeometryRegistry` / `moduleMaterialRegistry`. After
 * context loss on mobile (browser backgrounded), those singletons still hold
 * references to now-invalid GL objects — Three.js auto-reupload only fires
 * when `.dispose()` was called on the resource, so silent registries render
 * as black meshes. Calling disposeAllModule*() drops the GL handles; the
 * registries will lazily recreate the resources on the next scene render.
 * THREE.Cache is intentionally preserved — no re-fetch of GLBs needed.
 */
eventBus.on('canvas:context-restored', () => {
  try {
    forceDisposeOrphanedWebGLResources('gpu-lifecycle:context-restored');
  } catch (err) {
    console.warn('[gpuResourceLifecycle] context-restored cleanup failed:', err);
  }
  try {
    disposeAllModuleGeometries();
  } catch (err) {
    console.warn('[gpuResourceLifecycle] disposeAllModuleGeometries failed:', err);
  }
  try {
    disposeAllModuleMaterials();
  } catch (err) {
    console.warn('[gpuResourceLifecycle] disposeAllModuleMaterials failed:', err);
  }
  // Combat transient pool (particles, hit flashes) also holds GPU buffers.
  try {
    disposeCombatTransientPools();
  } catch (err) {
    console.warn('[gpuResourceLifecycle] disposeCombatTransientPools failed:', err);
  }
  // Quality-dependent cache (LOD textures, env maps) must rebuild too.
  try {
    evictQualityDependentGpuCache();
  } catch (err) {
    console.warn('[gpuResourceLifecycle] evictQualityDependentGpuCache failed:', err);
  }
});
