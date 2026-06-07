import { describe, it, expect, vi } from 'vitest';
import * as THREE from 'three';
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
    pool.release(a);
    const b = pool.acquire();

    expect(factory).toHaveBeenCalledTimes(1);
    expect(b).toBe(a);
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
});
