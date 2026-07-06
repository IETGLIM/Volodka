/**
 * Tracks the active R3F WebGLRenderer + Scene so error boundaries outside
 * the Canvas tree can force-dispose GPU resources when render throws skip
 * normal React unmount cleanup.
 */

import type * as THREE from 'three';
import { invalidateCanvasFirstFrame } from '@/engine/canvas/canvasFirstFrameSession';
import {
  clearPlayerExternalVelocity,
  clearPlayerRigidBody,
} from '@/engine/PlayerRigidBodyState';
import {
  disposeObject3DTree,
  disposeRendererShadowMaps,
} from '@/engine/three/disposeThreeResources';
import { releaseCanvasWebGlRenderer } from '@/engine/canvas/webGlRendererSingleton';

let registeredGl: THREE.WebGLRenderer | null = null;
let registeredScene: THREE.Scene | null = null;

export function registerCanvasRenderer(
  gl: THREE.WebGLRenderer,
  scene: THREE.Scene,
): void {
  registeredGl = gl;
  registeredScene = scene;
}

export function unregisterCanvasRenderer(gl: THREE.WebGLRenderer): void {
  if (registeredGl === gl) {
    registeredGl = null;
    registeredScene = null;
  }
}

/** Best-effort teardown of scene GPU resources when an error boundary catches a render throw. */
export function forceDisposeOrphanedWebGLResources(source?: string): void {
  const tag = source ? `:${source}` : '';

  try {
    clearPlayerExternalVelocity();
    clearPlayerRigidBody();

    const gl = registeredGl;
    const scene = registeredScene;
    if (!gl || !scene) return;

    const children = [...scene.children];
    for (const child of children) {
      disposeObject3DTree(child);
      scene.remove(child);
    }

    disposeRendererShadowMaps(gl, scene);
    try {
      gl.dispose();
      releaseCanvasWebGlRenderer(gl);
    } catch (err) {
      console.warn(`[forceDisposeOrphanedWebGLResources${tag}] renderer dispose failed:`, err);
    }
    registeredGl = null;
    registeredScene = null;
    invalidateCanvasFirstFrame();
  } catch (err) {
    console.warn(`[forceDisposeOrphanedWebGLResources${tag}]`, err);
  }
}

/** Clear stale renderer refs after HMR or tests. GltfPipelineInit re-registers on mount. */
export function resetCanvasRendererRegistry(): void {
  registeredGl = null;
  registeredScene = null;
}

/** [FIX] Get the active registered renderer — used by gltfPipeline to configure KTX2Loader
 *  before GltfPipelineInit's useEffect runs (race condition fix). */
export function getActiveCanvasRenderer(): THREE.WebGLRenderer | null {
  return registeredGl;
}

/** Test-only reset */
export function resetCanvasRendererRegistryForTests(): void {
  resetCanvasRendererRegistry();
}
