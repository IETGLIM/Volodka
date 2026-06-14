import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import {
  acquireSharedTexture,
  releaseSharedTexture,
  clearTextureReuseMapForTests,
} from '@/engine/three/textureReuseMap';
import { ObjectPool } from '@/engine/three/objectPool';
import {
  createThreeLodGroup,
  disposeThreeLodGroup,
} from '@/engine/three/threeLodGroup';
import {
  handleSceneGpuTransition,
  getSceneGltfAssetIds,
  evictSceneGpuCache,
} from '@/engine/scene/sceneGpuLifecycle';

describe('textureReuseMap', () => {
  it('ref-counts textures and disposes at zero', () => {
    const dispose = vi.fn();
    const texture = { dispose } as unknown as THREE.Texture;

    acquireSharedTexture('test', () => texture);
    acquireSharedTexture('test', () => texture);
    releaseSharedTexture('test');
    expect(dispose).not.toHaveBeenCalled();

    releaseSharedTexture('test');
    expect(dispose).toHaveBeenCalledTimes(1);
    clearTextureReuseMapForTests();
  });
});

describe('ObjectPool', () => {
  it('reuses released items', () => {
    const factory = vi.fn(() => ({ id: factory.mock.calls.length }));
    const pool = new ObjectPool(factory, undefined, 0);

    const a = pool.acquire();
    expect(a).not.toBeNull();
    pool.release(a!);
    const b = pool.acquire();

    expect(factory).toHaveBeenCalledTimes(1);
    expect(b).toBe(a);
  });

  it('caps burst acquire at maxSize instead of unbounded factory calls', () => {
    let nextId = 1;
    const factory = vi.fn(() => ({ id: nextId++ }));
    const pool = new ObjectPool(factory, undefined, 0, 2);

    const a = pool.acquire();
    const b = pool.acquire();
    const c = pool.acquire();

    expect(a).not.toBeNull();
    expect(b).not.toBeNull();
    expect(c).toBeNull();
    expect(factory).toHaveBeenCalledTimes(2);
    expect(pool.inUseCount).toBe(2);
    expect(pool.totalLive).toBe(2);
  });

  it('allows acquire again after release when at capacity', () => {
    let nextId = 1;
    const factory = vi.fn(() => ({ id: nextId++ }));
    const pool = new ObjectPool(factory, undefined, 0, 2);

    const a = pool.acquire()!;
    pool.acquire();
    expect(pool.acquire()).toBeNull();

    pool.release(a);
    const c = pool.acquire();

    expect(c).toBe(a);
    expect(factory).toHaveBeenCalledTimes(2);
  });

  it('disposes overflow on release when idle pool is full', () => {
    let nextId = 1;
    const factory = vi.fn(() => ({ id: nextId++ }));
    const disposed: number[] = [];
    const pool = new ObjectPool(
      factory,
      undefined,
      0,
      2,
      (item) => {
        disposed.push(item.id);
      },
    );

    const a = pool.acquire()!;
    const b = pool.acquire()!;
    expect(pool.acquire()).toBeNull();
    pool.release(a);
    pool.release(b);
    pool.release({ id: 99 } as { id: number });

    expect(pool.size).toBe(2);
    expect(pool.capacity).toBe(2);
    expect(disposed).toEqual([99]);
  });

  it('warns when overflow is dropped without disposeOverflow', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    let nextId = 1;
    const pool = new ObjectPool(() => ({ id: nextId++ }), undefined, 0, 1);

    const a = pool.acquire()!;
    expect(pool.acquire()).toBeNull();
    pool.release(a);
    pool.release({ id: 99 } as { id: number });

    expect(warn).toHaveBeenCalledWith(
      '[ObjectPool] Pool at capacity and disposeOverflow is unset — item was dropped and may leak GPU resources.',
    );
    warn.mockRestore();
  });
});

describe('threeLodGroup', () => {
  it('creates LOD levels and disposes on teardown', () => {
    const high = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial(),
    );
    const low = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial(),
    );

    vi.spyOn(high.geometry, 'dispose');
    vi.spyOn(low.geometry, 'dispose');

    const lod = createThreeLodGroup([
      { object: high, distance: 0 },
      { object: low, distance: 50 },
    ]);

    expect(lod.levels).toHaveLength(2);
    disposeThreeLodGroup(lod);
    expect(high.geometry.dispose).toHaveBeenCalled();
    expect(low.geometry.dispose).toHaveBeenCalled();
  });
});

describe('sceneGpuLifecycle', () => {
  it('maps known scenes to GLTF asset ids', () => {
    expect(getSceneGltfAssetIds('cafe_evening')).toContain('env_cafe_props');
    expect(getSceneGltfAssetIds('volodka_room')).toContain('player_volodka');
  });

  it('handleSceneGpuTransition does not throw for unknown scenes', () => {
    expect(() => handleSceneGpuTransition('battle', 'office_day')).not.toThrow();
  });

  describe('evictSceneGpuCache', () => {
    beforeEach(() => {
      vi.spyOn(useGLTF, 'clear').mockImplementation(() => {});
      vi.spyOn(THREE.Cache, 'remove').mockImplementation(() => {});
    });

    it('evicts prop GLBs for the scene being left', () => {
      evictSceneGpuCache('volodka_room');

      expect(useGLTF.clear).toHaveBeenCalledWith('/models/props/desk.glb');
      expect(useGLTF.clear).toHaveBeenCalledWith('/models/props/bed.glb');
      expect(THREE.Cache.remove).toHaveBeenCalledWith('/models/props/desk.glb');
    });

    it('evicts NPC GLBs for the scene being left', () => {
      evictSceneGpuCache('cafe_evening');

      expect(useGLTF.clear).toHaveBeenCalledWith('/models/npcs/cafe_barista.glb');
      expect(THREE.Cache.remove).toHaveBeenCalledWith('/models/npcs/cafe_barista.glb');
    });

    it('keeps prop GLBs shared between from and keep scenes', () => {
      evictSceneGpuCache('volodka_room', 'office_day');

      expect(useGLTF.clear).not.toHaveBeenCalledWith('/models/props/desk.glb');
      expect(useGLTF.clear).toHaveBeenCalledWith('/models/props/bed.glb');
    });
  });
});
