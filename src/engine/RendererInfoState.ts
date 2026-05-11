/**
 * Module-level shared state for Three.js renderer info.
 *
 * The R3F Canvas runs inside its own React tree, so `useThree()` is not
 * accessible from DOM-side components like DevPanel. This module provides
 * a simple global bridge: the canvas writes renderer.info here every frame,
 * and DevPanel reads it at its leisure.
 *
 * Write path:  <RendererInfoBridge />  (R3F component, runs inside Canvas)
 * Read path:   getRendererInfo()       (called from DOM-side DevPanel)
 */

export interface RendererInfoSnapshot {
  /** Total draw calls in the last frame */
  drawCalls: number;
  /** Total triangles rendered */
  triangles: number;
  /** Number of textures in GPU memory */
  textures: number;
  /** Number of geometries in GPU memory */
  geometries: number;
  /** Number of programs (shaders) compiled */
  programs: number;
  /** Current device pixel ratio of the canvas */
  dpr: number;
  /** Timestamp of the last update (performance.now) */
  timestamp: number;
}

let snapshot: RendererInfoSnapshot = {
  drawCalls: 0,
  triangles: 0,
  textures: 0,
  geometries: 0,
  programs: 0,
  dpr: 1,
  timestamp: 0,
};

/** Write a new snapshot (called by RendererInfoBridge inside Canvas) */
export function setRendererInfo(info: Partial<RendererInfoSnapshot>): void {
  snapshot = { ...snapshot, ...info, timestamp: performance.now() };
}

/** Read the current snapshot (called by DevPanel) */
export function getRendererInfo(): RendererInfoSnapshot {
  return snapshot;
}
