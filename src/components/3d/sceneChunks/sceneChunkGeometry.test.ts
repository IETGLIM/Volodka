import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('scene chunk module geometries', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('VolodkaRoomClutterChunk registers all module-level geometries on import', async () => {
    const { getRegisteredModuleGeometryCount } = await import('@/engine/three/moduleGeometryRegistry');
    const { getRegisteredModuleMaterialCount } = await import('@/engine/three/moduleMaterialRegistry');
    expect(getRegisteredModuleGeometryCount()).toBe(0);
    await import('@/components/3d/sceneChunks/volodkaRoom/VolodkaRoomClutterChunk');
    expect(getRegisteredModuleGeometryCount()).toBe(25);
    expect(getRegisteredModuleMaterialCount()).toBe(25);
  });

  it('HomeEveningPropsChunk registers all module-level geometries on import', async () => {
    const { getRegisteredModuleGeometryCount } = await import('@/engine/three/moduleGeometryRegistry');
    const { getRegisteredModuleMaterialCount } = await import('@/engine/three/moduleMaterialRegistry');
    expect(getRegisteredModuleGeometryCount()).toBe(0);
    await import('@/components/3d/sceneChunks/homeEvening/HomeEveningPropsChunk');
    expect(getRegisteredModuleGeometryCount()).toBe(8);
    expect(getRegisteredModuleMaterialCount()).toBe(8);
  });

  it('StreetNightClutterChunk registers shared module geometries on import', async () => {
    const { getRegisteredModuleGeometryCount } = await import('@/engine/three/moduleGeometryRegistry');
    const { getRegisteredModuleMaterialCount } = await import('@/engine/three/moduleMaterialRegistry');
    expect(getRegisteredModuleGeometryCount()).toBe(0);
    await import('@/components/3d/sceneChunks/streetNight/StreetNightClutterChunk');
    expect(getRegisteredModuleGeometryCount()).toBe(2);
    expect(getRegisteredModuleMaterialCount()).toBe(2);
  });

  it('scene chunks dedupe identical geometry parameters via the central registry', async () => {
    const {
      getRegisteredModuleGeometryCount,
      getSharedCylinderGeometry,
    } = await import('@/engine/three/moduleGeometryRegistry');

    await import('@/components/3d/sceneChunks/volodkaRoom/VolodkaRoomClutterChunk');
    const afterVolodka = getRegisteredModuleGeometryCount();

    await import('@/components/3d/sceneChunks/homeEvening/HomeEveningPropsChunk');
    const afterBoth = getRegisteredModuleGeometryCount();

    expect(afterVolodka).toBe(25);
    expect(afterBoth).toBe(33);

    const volodkaMug = getSharedCylinderGeometry(0.1, 0.08, 0.3, 8);
    const homeGlass = getSharedCylinderGeometry(0.12, 0.1, 0.12, 8);
    expect(volodkaMug).not.toBe(homeGlass);
    expect(getSharedCylinderGeometry(0.1, 0.08, 0.03, 8)).toBe(
      getSharedCylinderGeometry(0.1, 0.08, 0.03, 8),
    );
  });

  it('lazySceneChunk HMR beforeUpdate clears scene chunk GPU caches', async () => {
    const beforeUpdateHandlers: Array<() => void> = [];
    vi.doMock('@/shared/dev/hmrDispose', () => ({
      registerHmrBeforeUpdate: (handler: () => void) => {
        beforeUpdateHandlers.push(handler);
      },
      registerHmrDispose: vi.fn(),
      withHmrCleanup: (cleanup: () => void) => cleanup,
      resetHmrBeforeUpdateForTests: vi.fn(),
    }));

    await import('@/components/3d/sceneChunks/lazySceneChunk');
    const { getRegisteredModuleGeometryCount } = await import('@/engine/three/moduleGeometryRegistry');
    await import('@/components/3d/sceneChunks/streetNight/StreetNightClutterChunk');

    expect(getRegisteredModuleGeometryCount()).toBe(2);
    expect(beforeUpdateHandlers.length).toBeGreaterThan(0);

    for (const handler of beforeUpdateHandlers) {
      handler();
    }

    expect(getRegisteredModuleGeometryCount()).toBe(0);
  });
});
