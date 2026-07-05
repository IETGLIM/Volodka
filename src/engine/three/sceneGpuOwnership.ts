/**
 * Per-scene ownership for module-level Three.js GPU caches.
 * Resources claimed while a scene module loads are released on scene:unload
 * (refcounted — shared geometries/materials survive until every scene releases).
 */

import type * as THREE from 'three';
import type { SceneId } from '@/shared/types/game';

type GpuResource = THREE.BufferGeometry | THREE.Material;

const sceneGeometryClaims = new Map<SceneId, Set<THREE.BufferGeometry>>();
const sceneMaterialClaims = new Map<SceneId, Set<THREE.Material>>();
const geometrySceneRefCount = new Map<THREE.BufferGeometry, number>();
const materialSceneRefCount = new Map<THREE.Material, number>();

let activeSceneGpuRegistration: SceneId | null = null;

export function setSceneGpuRegistrationContext(sceneId: SceneId | null): void {
  activeSceneGpuRegistration = sceneId;
}

export function getSceneGpuRegistrationContext(): SceneId | null {
  return activeSceneGpuRegistration;
}

export function claimGeometryForActiveScene(geometry: THREE.BufferGeometry): void {
  const sceneId = activeSceneGpuRegistration;
  if (!sceneId) return;
  claimGeometryForScene(sceneId, geometry);
}

export function claimMaterialForActiveScene(material: THREE.Material): void {
  const sceneId = activeSceneGpuRegistration;
  if (!sceneId) return;
  claimMaterialForScene(sceneId, material);
}

export function claimGeometryForScene(sceneId: SceneId, geometry: THREE.BufferGeometry): void {
  let claims = sceneGeometryClaims.get(sceneId);
  if (!claims) {
    claims = new Set();
    sceneGeometryClaims.set(sceneId, claims);
  }
  if (claims.has(geometry)) return;

  claims.add(geometry);
  geometrySceneRefCount.set(geometry, (geometrySceneRefCount.get(geometry) ?? 0) + 1);
}

export function claimMaterialForScene(sceneId: SceneId, material: THREE.Material): void {
  let claims = sceneMaterialClaims.get(sceneId);
  if (!claims) {
    claims = new Set();
    sceneMaterialClaims.set(sceneId, claims);
  }
  if (claims.has(material)) return;

  claims.add(material);
  materialSceneRefCount.set(material, (materialSceneRefCount.get(material) ?? 0) + 1);
}

export function isSceneClaimedGeometry(geometry: THREE.BufferGeometry): boolean {
  return geometrySceneRefCount.has(geometry);
}

export function isSceneClaimedMaterial(material: THREE.Material): boolean {
  return materialSceneRefCount.has(material);
}

export function getSceneClaimedGeometryCount(sceneId: SceneId): number {
  return sceneGeometryClaims.get(sceneId)?.size ?? 0;
}

export function getSceneClaimedMaterialCount(sceneId: SceneId): number {
  return sceneMaterialClaims.get(sceneId)?.size ?? 0;
}

export interface SceneGpuUnloadHandlers {
  disposeGeometry: (geometry: THREE.BufferGeometry) => void;
  disposeMaterial: (material: THREE.Material) => void;
}

function releaseSceneClaims<T extends GpuResource>(
  sceneId: SceneId,
  claims: Map<SceneId, Set<T>>,
  refCounts: Map<T, number>,
  dispose: (resource: T) => void,
): void {
  const owned = claims.get(sceneId);
  if (!owned) return;

  for (const resource of owned) {
    const next = (refCounts.get(resource) ?? 1) - 1;
    if (next <= 0) {
      refCounts.delete(resource);
      dispose(resource);
    } else {
      refCounts.set(resource, next);
    }
  }

  claims.delete(sceneId);
}

/** Release scene-scoped module GPU resources (refcounted shared caches). */
export function unloadSceneGpuOwnership(
  sceneId: SceneId,
  handlers: SceneGpuUnloadHandlers,
): void {
  releaseSceneClaims(sceneId, sceneGeometryClaims, geometrySceneRefCount, handlers.disposeGeometry);
  releaseSceneClaims(sceneId, sceneMaterialClaims, materialSceneRefCount, handlers.disposeMaterial);
}

/** Test / engine dispose — clear ownership maps without disposing GPU objects. */
export function resetSceneGpuOwnershipForTests(): void {
  sceneGeometryClaims.clear();
  sceneMaterialClaims.clear();
  geometrySceneRefCount.clear();
  materialSceneRefCount.clear();
  activeSceneGpuRegistration = null;
}
