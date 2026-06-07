import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react';
import { useThree } from '@react-three/fiber';
import type * as THREE from 'three';
import {
  disposeObject3DTree,
  disposeRendererShadowMaps,
  type DisposeThreeOptions,
} from '@/engine/three/disposeThreeResources';

export interface UseThreeCleanupOptions extends DisposeThreeOptions {
  /**
   * When set, GPU resources are disposed in a layout effect whenever sceneId
   * changes — before the next scene paints — in addition to unmount cleanup.
   */
  sceneId?: string;
}

/**
 * Dispose all Three.js GPU resources under `groupRef` on unmount.
 * Handles Mesh, SkinnedMesh, InstancedMesh, Lines, Points, Sprites, material
 * texture maps, shader uniforms, skeleton bone textures, and light shadow maps.
 *
 * Pass `options.skip` for module-level shared geometry/material caches
 * (procedural NPC/player singletons).
 *
 * Do **not** pass WebGLRenderer here — the renderer is canvas-scoped; use
 * `useCanvasRendererCleanup()` only when the entire Canvas unmounts.
 */
export function useThreeCleanup(
  groupRef: RefObject<THREE.Object3D | null>,
  options?: UseThreeCleanupOptions,
) {
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const sceneId = options?.sceneId;

  const disposeTree = () => {
    disposeObject3DTree(groupRef.current, optionsRef.current);
  };

  useLayoutEffect(() => {
    if (sceneId === undefined) return undefined;
    return disposeTree;
  }, [sceneId]);

  useEffect(() => () => disposeTree(), [groupRef]);
}

/**
 * Canvas-level renderer teardown — only mount on the root Canvas unmount path.
 * Never call during scene transitions (same Canvas / same renderer).
 */
export function useCanvasRendererCleanup(): void {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);

  useEffect(() => () => {
    disposeRendererShadowMaps(gl, scene);
    gl.dispose();
  }, [gl, scene]);
}
