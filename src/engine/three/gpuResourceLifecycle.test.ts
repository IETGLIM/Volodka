import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as THREE from 'three';
import {
  disposeAllEngineGpuResources,
  registerGpuHmrHandler,
  resetGpuHmrHandlersForTests,
} from '@/engine/three/gpuResourceLifecycle';
import { registerModuleGeometry } from '@/engine/three/moduleGeometryRegistry';
import { resetGltfPipeline, isGltfPipelineConfigured } from '@/engine/assets/gltfPipeline';
import {
  resetCanvasRendererRegistry,
  forceDisposeOrphanedWebGLResources,
} from '@/engine/canvas/canvasRendererRegistry';
import { resetQualityGpuCleanupListener } from '@/engine/graphics/graphicsGpuCleanup';

vi.mock('@/engine/canvas/canvasRendererRegistry', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/engine/canvas/canvasRendererRegistry')>();
  return {
    ...actual,
    forceDisposeOrphanedWebGLResources: vi.fn(),
  };
});

vi.mock('@/engine/graphics/graphicsGpuCleanup', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/engine/graphics/graphicsGpuCleanup')>();
  return {
    ...actual,
    evictQualityDependentGpuCache: vi.fn(),
  };
});

describe('gpuResourceLifecycle', () => {
  beforeEach(() => {
    resetGpuHmrHandlersForTests();
    resetGltfPipeline();
    resetCanvasRendererRegistry();
    resetQualityGpuCleanupListener();
    vi.mocked(forceDisposeOrphanedWebGLResources).mockClear();
  });

  afterEach(() => {
    resetGpuHmrHandlersForTests();
    resetGltfPipeline();
  });

  it('disposeAllEngineGpuResources(engine) force-disposes live canvas resources', () => {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    registerModuleGeometry(geometry);
    vi.spyOn(geometry, 'dispose');

    disposeAllEngineGpuResources('engine');

    expect(forceDisposeOrphanedWebGLResources).toHaveBeenCalledWith('gpu-lifecycle:engine');
    expect(geometry.dispose).toHaveBeenCalled();
  });

  it('disposeAllEngineGpuResources(hmr) skips live scene teardown and resets loader guards', () => {
    disposeAllEngineGpuResources('hmr');

    expect(forceDisposeOrphanedWebGLResources).not.toHaveBeenCalled();
    expect(isGltfPipelineConfigured()).toBe(false);
  });

  it('registerGpuHmrHandler runs during GPU dispose', () => {
    const handler = vi.fn();
    registerGpuHmrHandler(handler);

    disposeAllEngineGpuResources('hmr');

    expect(handler).toHaveBeenCalledTimes(1);
  });
});
