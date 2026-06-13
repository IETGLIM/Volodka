/**
 * Tracks module-level BufferGeometry singletons used by procedural scene visuals.
 * Disposed on canvas unmount and HMR — not on scene:unload (geometries are reused).
 */

import type * as THREE from 'three';
import { registerGlobalCleanup } from '@/engine/core/GlobalCleanupService';
import { registerHmrDispose } from '@/shared/dev/hmrDispose';

const moduleGeometries = new Set<THREE.BufferGeometry>();

/** Register a module-level geometry for lifecycle disposal. Returns the same instance. */
export function registerModuleGeometry<T extends THREE.BufferGeometry>(geometry: T): T {
  moduleGeometries.add(geometry);
  return geometry;
}

/** Register many module-level geometries at once. */
export function registerModuleGeometries(geometries: Iterable<THREE.BufferGeometry>): void {
  for (const geometry of geometries) {
    moduleGeometries.add(geometry);
  }
}

export function disposeAllModuleGeometries(): void {
  for (const geometry of moduleGeometries) {
    geometry.dispose();
  }
  moduleGeometries.clear();
}

registerGlobalCleanup((ctx) => {
  if (ctx.reason === 'unmount') {
    disposeAllModuleGeometries();
  }
});

registerHmrDispose(disposeAllModuleGeometries);
