/**
 * Tracks the live R3F WebGLRenderer so factory remounts (antialias / error retry)
 * dispose the previous context before allocating another.
 */

import type * as THREE from 'three';

let activeRenderer: THREE.WebGLRenderer | null = null;

export function adoptCanvasWebGlRenderer(renderer: THREE.WebGLRenderer): THREE.WebGLRenderer {
  if (activeRenderer && activeRenderer !== renderer) {
    try {
      activeRenderer.dispose();
    } catch {
      // Context may already be lost.
    }
  }
  activeRenderer = renderer;
  return renderer;
}

/** Call after gl.dispose() on Canvas unmount — avoids double-dispose in the factory. */
export function releaseCanvasWebGlRenderer(renderer: THREE.WebGLRenderer): void {
  if (activeRenderer === renderer) {
    activeRenderer = null;
  }
}

/** Test-only reset */
export function resetCanvasWebGlRendererSingletonForTests(): void {
  activeRenderer = null;
}
