/**
 * Tracks module-level MeshStandardMaterial singletons for procedural scene visuals.
 * Disposed on canvas unmount and HMR — not on scene:unload (materials are reused).
 */

import * as THREE from 'three';
import { registerGlobalCleanup, registerModuleGlobalCleanupBinder } from '@/engine/core/GlobalCleanupService';
import { registerHmrBeforeUpdate, registerHmrDispose } from '@/shared/dev/hmrDispose';
import { trackModuleMaterial, untrackModuleMaterial } from '@/engine/performance/GpuResourceBudgetTracker';

const moduleMaterials = new Set<THREE.MeshStandardMaterial>();
const sharedStandardMaterialCache = new Map<string, THREE.MeshStandardMaterial>();

function serializeStandardMaterialParams(params: THREE.MeshStandardMaterialParameters): string {
  const color =
    params.color instanceof THREE.Color
      ? params.color.getHexString()
      : String(params.color ?? 'ffffff');
  return [
    color,
    params.roughness ?? 1,
    params.metalness ?? 0,
    params.transparent ? 1 : 0,
    params.opacity ?? 1,
    params.side ?? THREE.FrontSide,
    params.polygonOffset ? 1 : 0,
    params.polygonOffsetFactor ?? 0,
    params.polygonOffsetUnits ?? 0,
  ].join(':');
}

/** Register a module-level material for lifecycle disposal. Returns the same instance. */
export function registerModuleMaterial<T extends THREE.MeshStandardMaterial>(material: T): T {
  moduleMaterials.add(material);
  trackModuleMaterial(material);
  return material;
}

export function getSharedStandardMaterial(
  params: THREE.MeshStandardMaterialParameters,
): THREE.MeshStandardMaterial {
  const key = serializeStandardMaterialParams(params);
  const cached = sharedStandardMaterialCache.get(key);
  if (cached) return cached;

  const material = registerModuleMaterial(new THREE.MeshStandardMaterial(params));
  sharedStandardMaterialCache.set(key, material);
  return material;
}

export function disposeAllModuleMaterials(): void {
  for (const material of moduleMaterials) {
    untrackModuleMaterial(material);
    material.dispose();
  }
  moduleMaterials.clear();
  sharedStandardMaterialCache.clear();
}

/** Test / diagnostics — count of module-level materials tracked for disposal. */
export function getRegisteredModuleMaterialCount(): number {
  return moduleMaterials.size;
}

let unregisterModuleMaterialGlobalCleanup: (() => void) | null = null;

function bindModuleMaterialGlobalCleanup(): void {
  unregisterModuleMaterialGlobalCleanup?.();
  unregisterModuleMaterialGlobalCleanup = registerGlobalCleanup((ctx) => {
    if (ctx.reason === 'unmount') {
      disposeAllModuleMaterials();
    }
  });
}

registerModuleGlobalCleanupBinder(bindModuleMaterialGlobalCleanup);
bindModuleMaterialGlobalCleanup();

registerHmrBeforeUpdate(disposeAllModuleMaterials);
registerHmrDispose(disposeAllModuleMaterials);
