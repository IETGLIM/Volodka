import { describe, it, expect, vi, beforeEach } from 'vitest';
import { eventBus } from '@/engine/EventBus';
import {
  bindSceneChunkGpuLifecycle,
  unbindSceneChunkGpuLifecycle,
} from '@/components/3d/sceneChunks/sceneChunkGpuLifecycle';
import {
  disposeAllModuleGeometries,
  getRegisteredModuleGeometryCount,
  getSharedBoxGeometry,
} from '@/engine/three/moduleGeometryRegistry';
import {
  disposeAllModuleMaterials,
  getRegisteredModuleMaterialCount,
  getSharedStandardMaterial,
} from '@/engine/three/moduleMaterialRegistry';
import {
  getSceneClaimedGeometryCount,
  resetSceneGpuOwnership,
} from '@/engine/three/sceneGpuOwnership';
import { importWithSceneGpuRegistration } from '@/engine/three/importWithSceneGpuRegistration';
import { resetSceneModuleGpuPoolsForTests } from '@/engine/three/sceneModuleGpu';
import { unloadSceneGpuResources } from '@/engine/three/unloadSceneGpuResources';

describe('scene GPU unload lifecycle', () => {
  beforeEach(() => {
    unbindSceneChunkGpuLifecycle();
    disposeAllModuleMaterials();
    disposeAllModuleGeometries();
    resetSceneGpuOwnership();
    resetSceneModuleGpuPoolsForTests();
  });

  it('unloadSceneGpuResources disposes scene-owned resources and lowers registry counts', async () => {
    await importWithSceneGpuRegistration('volodka_room', async () => {
      getSharedBoxGeometry(1.1, 2.2, 3.3);
      getSharedStandardMaterial({ color: '#abcdef', roughness: 0.42 });
      return {};
    });

    const geometry = getSharedBoxGeometry(1.1, 2.2, 3.3);
    const material = getSharedStandardMaterial({ color: '#abcdef', roughness: 0.42 });

    expect(getRegisteredModuleGeometryCount()).toBe(1);
    expect(getRegisteredModuleMaterialCount()).toBe(1);
    expect(getSceneClaimedGeometryCount('volodka_room')).toBe(1);

    vi.spyOn(geometry, 'dispose');
    vi.spyOn(material, 'dispose');

    unloadSceneGpuResources('volodka_room');

    expect(geometry.dispose).toHaveBeenCalledTimes(1);
    expect(material.dispose).toHaveBeenCalledTimes(1);
    expect(getRegisteredModuleGeometryCount()).toBe(0);
    expect(getRegisteredModuleMaterialCount()).toBe(0);
    expect(getSceneClaimedGeometryCount('volodka_room')).toBe(0);
  });

  it('keeps shared resources alive while another scene still claims them', async () => {
    const sharedGeo = getSharedBoxGeometry(2, 2, 2);
    const sharedMat = getSharedStandardMaterial({ color: '#112233', roughness: 0.5 });

    await importWithSceneGpuRegistration('volodka_room', async () => {
      getSharedBoxGeometry(2, 2, 2);
      getSharedStandardMaterial({ color: '#112233', roughness: 0.5 });
      return {};
    });
    await importWithSceneGpuRegistration('home_evening', async () => {
      getSharedBoxGeometry(2, 2, 2);
      getSharedStandardMaterial({ color: '#112233', roughness: 0.5 });
      return {};
    });

    vi.spyOn(sharedGeo, 'dispose');
    vi.spyOn(sharedMat, 'dispose');

    unloadSceneGpuResources('volodka_room');

    expect(sharedGeo.dispose).not.toHaveBeenCalled();
    expect(sharedMat.dispose).not.toHaveBeenCalled();
    expect(getRegisteredModuleGeometryCount()).toBe(1);
    expect(getRegisteredModuleMaterialCount()).toBe(1);

    unloadSceneGpuResources('home_evening');

    expect(sharedGeo.dispose).toHaveBeenCalledTimes(1);
    expect(sharedMat.dispose).toHaveBeenCalledTimes(1);
    expect(getRegisteredModuleGeometryCount()).toBe(0);
  });

  it('bindSceneChunkGpuLifecycle releases resources on scene:unload', async () => {
    bindSceneChunkGpuLifecycle();

    await importWithSceneGpuRegistration('street_night', async () => {
      await import('@/components/3d/sceneChunks/streetNight/StreetNightClutterChunk');
      return {};
    });

    const { StreetNightClutterChunk } = await import(
      '@/components/3d/sceneChunks/streetNight/StreetNightClutterChunk'
    );
    StreetNightClutterChunk();

    expect(getRegisteredModuleGeometryCount()).toBeGreaterThan(0);

    eventBus.emit('scene:unload', { sceneId: 'street_night', nextSceneId: 'volodka_room' });

    expect(getRegisteredModuleGeometryCount()).toBe(0);
    expect(getRegisteredModuleMaterialCount()).toBe(0);
  });
});
