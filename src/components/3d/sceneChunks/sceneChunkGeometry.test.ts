import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('scene chunk module geometries', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('StreetNightClutterChunk registers GPU resources when rendered', async () => {
    const { getRegisteredModuleGeometryCount } = await import('@/engine/three/moduleGeometryRegistry');
    const { getRegisteredModuleMaterialCount } = await import('@/engine/three/moduleMaterialRegistry');
    const { StreetNightClutterChunk } = await import(
      '@/components/3d/sceneChunks/streetNight/StreetNightClutterChunk'
    );

    expect(getRegisteredModuleGeometryCount()).toBe(0);
    StreetNightClutterChunk();
    expect(getRegisteredModuleGeometryCount()).toBe(2);
    expect(getRegisteredModuleMaterialCount()).toBe(2);
  });

  it('HomeEveningPropsChunk registers GPU resources when rendered', async () => {
    const { getRegisteredModuleGeometryCount } = await import('@/engine/three/moduleGeometryRegistry');
    const { getRegisteredModuleMaterialCount } = await import('@/engine/three/moduleMaterialRegistry');
    const { HomeEveningPropsChunk } = await import(
      '@/components/3d/sceneChunks/homeEvening/HomeEveningPropsChunk'
    );

    expect(getRegisteredModuleGeometryCount()).toBe(0);
    HomeEveningPropsChunk();
    expect(getRegisteredModuleGeometryCount()).toBe(8);
    expect(getRegisteredModuleMaterialCount()).toBe(8);
  });

  it('scene chunks dedupe identical geometry parameters via the central registry', async () => {
    const { getRegisteredModuleGeometryCount } = await import('@/engine/three/moduleGeometryRegistry');
    const { VolodkaRoomClutterChunk } = await import(
      '@/components/3d/sceneChunks/volodkaRoom/VolodkaRoomClutterChunk'
    );
    const { HomeEveningPropsChunk } = await import(
      '@/components/3d/sceneChunks/homeEvening/HomeEveningPropsChunk'
    );

    VolodkaRoomClutterChunk();
    const afterVolodka = getRegisteredModuleGeometryCount();

    HomeEveningPropsChunk();
    const afterBoth = getRegisteredModuleGeometryCount();

    expect(afterVolodka).toBe(25);
    expect(afterBoth).toBe(33);
  });

  it('sceneChunkGpuLifecycle HMR beforeUpdate clears scene chunk GPU caches', async () => {
    const beforeUpdateHandlers: Array<() => void> = [];
    vi.doMock('@/shared/dev/hmrDispose', () => ({
      registerHmrBeforeUpdate: (handler: () => void) => {
        beforeUpdateHandlers.push(handler);
      },
      registerHmrDispose: vi.fn(),
      withHmrCleanup: (cleanup: () => void) => cleanup,
      resetHmrBeforeUpdateForTests: vi.fn(),
    }));

    await import('@/components/3d/sceneChunks/sceneChunkGpuLifecycle');
    const { getRegisteredModuleGeometryCount } = await import('@/engine/three/moduleGeometryRegistry');
    const { StreetNightClutterChunk } = await import(
      '@/components/3d/sceneChunks/streetNight/StreetNightClutterChunk'
    );
    StreetNightClutterChunk();

    expect(getRegisteredModuleGeometryCount()).toBe(2);
    expect(beforeUpdateHandlers.length).toBeGreaterThan(0);

    for (const handler of beforeUpdateHandlers) {
      handler();
    }

    expect(getRegisteredModuleGeometryCount()).toBe(0);
  });
});
