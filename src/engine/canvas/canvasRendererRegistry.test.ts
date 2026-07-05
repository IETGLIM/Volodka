import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as THREE from 'three';
import {
  forceDisposeOrphanedWebGLResources,
  registerCanvasRenderer,
  resetCanvasRendererRegistryForTests,
  unregisterCanvasRenderer,
} from '@/engine/canvas/canvasRendererRegistry';
import { disposeObject3DTree } from '@/engine/three/disposeThreeResources';

vi.mock('@/engine/three/disposeThreeResources', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/engine/three/disposeThreeResources')>();
  return {
    ...actual,
    disposeObject3DTree: vi.fn(actual.disposeObject3DTree),
    disposeRendererShadowMaps: vi.fn(actual.disposeRendererShadowMaps),
  };
});

vi.mock('@/engine/PlayerRigidBodyState', () => ({
  clearPlayerExternalVelocity: vi.fn(),
  clearPlayerRigidBody: vi.fn(),
}));

describe('forceDisposeOrphanedWebGLResources', () => {
  beforeEach(() => {
    resetCanvasRendererRegistryForTests();
    vi.clearAllMocks();
  });

  it('is a no-op when no canvas renderer is registered', () => {
    expect(() => forceDisposeOrphanedWebGLResources('test')).not.toThrow();
    expect(disposeObject3DTree).not.toHaveBeenCalled();
  });

  it('disposes scene children and clears the scene graph', () => {
    const dispose = vi.fn();
    const gl = { shadowMap: { needsUpdate: false }, dispose } as unknown as THREE.WebGLRenderer;
    const scene = new THREE.Scene();
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial(),
    );
    scene.add(mesh);

    registerCanvasRenderer(gl, scene);
    forceDisposeOrphanedWebGLResources('canvas');

    expect(disposeObject3DTree).toHaveBeenCalledWith(mesh);
    expect(scene.children).toHaveLength(0);
    expect(dispose).toHaveBeenCalled();

    unregisterCanvasRenderer(gl);
  });
});
