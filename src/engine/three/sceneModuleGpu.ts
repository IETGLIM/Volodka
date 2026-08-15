/**
 * Revivable per-scene GPU module pools — recreate procedural caches after scene:unload.
 */

import type { SceneId } from '@/shared/types/game';
import {
  claimGeometryForScene,
  claimMaterialForScene,
  setSceneGpuRegistrationContext,
} from '@/engine/three/sceneGpuOwnership';
import { BufferGeometry, Material } from 'three';

interface SceneModuleGpuEntry<T extends object> {
  resources: T;
  disposed: boolean;
}

const modulePools = new Map<string, SceneModuleGpuEntry<object>>();
const sceneModuleKeys = new Map<SceneId, Set<string>>();

function trackModuleKeyForScene(sceneId: SceneId, moduleKey: string): void {
  let keys = sceneModuleKeys.get(sceneId);
  if (!keys) {
    keys = new Set();
    sceneModuleKeys.set(sceneId, keys);
  }
  keys.add(moduleKey);
}

function claimSceneModuleResources(sceneId: SceneId, resources: object): void {
  for (const value of Object.values(resources)) {
    if (value instanceof BufferGeometry) {
      claimGeometryForScene(sceneId, value);
    } else if (value instanceof Material) {
      claimMaterialForScene(sceneId, value);
    }
  }
}

/**
 * Lazy / revivable GPU bundle for a scene sub-chunk module.
 * Recreates resources when the pool was disposed on scene:unload.
 */
export function createSceneModuleGpu<T extends object>(
  moduleKey: string,
  sceneId: SceneId,
  factory: () => T,
): T {
  let entry = modulePools.get(moduleKey) as SceneModuleGpuEntry<T> | undefined;
  if (!entry || entry.disposed) {
    setSceneGpuRegistrationContext(sceneId);
    try {
      const resources = factory();
      claimSceneModuleResources(sceneId, resources);
      entry = { resources, disposed: false };
      modulePools.set(moduleKey, entry);
      trackModuleKeyForScene(sceneId, moduleKey);
    } finally {
      setSceneGpuRegistrationContext(null);
    }
  }

  return entry.resources;
}

/** Mark scene module pools disposed so the next access recreates GPU resources. */
export function markSceneModuleGpuPoolsDisposed(sceneId: SceneId): void {
  const keys = sceneModuleKeys.get(sceneId);
  if (!keys) return;

  for (const moduleKey of keys) {
    const entry = modulePools.get(moduleKey);
    if (entry) {
      entry.disposed = true;
    }
  }

  sceneModuleKeys.delete(sceneId);
}

/** Test / engine dispose */
export function resetSceneModuleGpuPoolsForTests(): void {
  modulePools.clear();
  sceneModuleKeys.clear();
}
