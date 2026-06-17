/**
 * Tracks module-level BufferGeometry singletons used by procedural scene visuals.
 * Scene-scoped resources (claimed during scene module import) dispose on scene:unload.
 * Session-scoped resources (InteriorModels, NPC caches) dispose on canvas unmount / HMR.
 */

import * as THREE from 'three';
import { registerGlobalCleanup, registerModuleGlobalCleanupBinder } from '@/engine/core/GlobalCleanupService';
import { registerHmrBeforeUpdate, registerHmrDispose } from '@/shared/dev/hmrDispose';
import { trackModuleGeometry, untrackModuleGeometry } from '@/engine/performance/GpuResourceBudgetTracker';
import {
  claimGeometryForActiveScene,
  claimGeometryForScene,
  resetSceneGpuOwnershipForTests,
} from '@/engine/three/sceneGpuOwnership';
import type { SceneId } from '@/shared/types/game';

const moduleGeometries = new Set<THREE.BufferGeometry>();
const sharedGeometryCache = new Map<string, THREE.BufferGeometry>();

function cacheKey(kind: string, args: readonly number[]): string {
  return `${kind}:${args.join(':')}`;
}

function getSharedGeometry<T extends THREE.BufferGeometry>(
  kind: string,
  args: readonly number[],
  factory: () => T,
): T {
  const key = cacheKey(kind, args);
  const cached = sharedGeometryCache.get(key);
  if (cached && moduleGeometries.has(cached)) {
    claimGeometryForActiveScene(cached);
    return cached as T;
  }
  if (cached) sharedGeometryCache.delete(key);

  const geometry = registerModuleGeometry(factory());
  sharedGeometryCache.set(key, geometry);
  return geometry;
}

/** Register a module-level geometry for lifecycle disposal. Returns the same instance. */
export function registerModuleGeometry<T extends THREE.BufferGeometry>(geometry: T): T {
  moduleGeometries.add(geometry);
  trackModuleGeometry(geometry);
  claimGeometryForActiveScene(geometry);
  return geometry;
}

/** True when geometry is tracked by the module registry (skip mesh-tree dispose). */
export function isRegistryManagedGeometry(geometry: THREE.BufferGeometry): boolean {
  return moduleGeometries.has(geometry);
}

/** Register many module-level geometries at once (per-module HMR dispose in dev). */
export function registerModuleGeometries(
  geometries: Iterable<THREE.BufferGeometry>,
  sceneId?: SceneId,
): void {
  const owned = [...geometries];
  for (const geometry of owned) {
    moduleGeometries.add(geometry);
    trackModuleGeometry(geometry);
    if (sceneId) {
      claimGeometryForScene(sceneId, geometry);
    } else {
      claimGeometryForActiveScene(geometry);
    }
  }
  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      for (const geometry of owned) {
        disposeRegisteredModuleGeometry(geometry);
      }
    });
  }
}

function evictSharedGeometryFromCache(geometry: THREE.BufferGeometry): void {
  for (const [key, cached] of sharedGeometryCache) {
    if (cached === geometry) {
      sharedGeometryCache.delete(key);
    }
  }
}

export function disposeRegisteredModuleGeometry(geometry: THREE.BufferGeometry): void {
  if (!moduleGeometries.has(geometry)) return;
  untrackModuleGeometry(geometry);
  geometry.dispose();
  moduleGeometries.delete(geometry);
  evictSharedGeometryFromCache(geometry);
}

export function getSharedBoxGeometry(width: number, height: number, depth: number): THREE.BoxGeometry {
  return getSharedGeometry('box', [width, height, depth], () => new THREE.BoxGeometry(width, height, depth));
}

export function getSharedPlaneGeometry(width: number, height: number): THREE.PlaneGeometry {
  return getSharedGeometry('plane', [width, height], () => new THREE.PlaneGeometry(width, height));
}

export function getSharedCylinderGeometry(
  radiusTop: number,
  radiusBottom: number,
  height: number,
  radialSegments: number,
): THREE.CylinderGeometry {
  return getSharedGeometry(
    'cylinder',
    [radiusTop, radiusBottom, height, radialSegments],
    () => new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments),
  );
}

export function getSharedSphereGeometry(
  radius: number,
  widthSegments: number,
  heightSegments: number,
): THREE.SphereGeometry {
  return getSharedGeometry(
    'sphere',
    [radius, widthSegments, heightSegments],
    () => new THREE.SphereGeometry(radius, widthSegments, heightSegments),
  );
}

export function getSharedCircleGeometry(radius: number, segments: number): THREE.CircleGeometry {
  return getSharedGeometry('circle', [radius, segments], () => new THREE.CircleGeometry(radius, segments));
}

export function getSharedConeGeometry(
  radius: number,
  height: number,
  radialSegments: number,
): THREE.ConeGeometry {
  return getSharedGeometry(
    'cone',
    [radius, height, radialSegments],
    () => new THREE.ConeGeometry(radius, height, radialSegments),
  );
}

export function getSharedTorusGeometry(
  radius: number,
  tube: number,
  radialSegments: number,
  tubularSegments: number,
  arc = Math.PI * 2,
): THREE.TorusGeometry {
  return getSharedGeometry(
    'torus',
    [radius, tube, radialSegments, tubularSegments, arc],
    () => new THREE.TorusGeometry(radius, tube, radialSegments, tubularSegments, arc),
  );
}

export function disposeAllModuleGeometries(): void {
  for (const geometry of moduleGeometries) {
    untrackModuleGeometry(geometry);
    geometry.dispose();
  }
  moduleGeometries.clear();
  sharedGeometryCache.clear();
  resetSceneGpuOwnershipForTests();
}

/** Test / diagnostics — count of module-level geometries tracked for disposal. */
export function getRegisteredModuleGeometryCount(): number {
  return moduleGeometries.size;
}

let unregisterModuleGeometryGlobalCleanup: (() => void) | null = null;

function bindModuleGeometryGlobalCleanup(): void {
  unregisterModuleGeometryGlobalCleanup?.();
  unregisterModuleGeometryGlobalCleanup = registerGlobalCleanup((ctx) => {
    if (ctx.reason === 'unmount') {
      disposeAllModuleGeometries();
    }
  });
}

registerModuleGlobalCleanupBinder(bindModuleGeometryGlobalCleanup);
bindModuleGeometryGlobalCleanup();

registerHmrBeforeUpdate(disposeAllModuleGeometries);
registerHmrDispose(disposeAllModuleGeometries);
