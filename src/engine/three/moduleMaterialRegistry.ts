/**
 * Tracks module-level MeshStandardMaterial singletons for procedural scene visuals.
 * Scene-scoped resources (claimed during scene module import) dispose on scene:unload.
 * Session-scoped resources dispose on canvas unmount / HMR.
 */

import * as THREE from 'three';
import { registerGlobalCleanup, registerModuleGlobalCleanupBinder } from '@/engine/core/GlobalCleanupService';
import { registerHmrBeforeUpdate, registerHmrDispose } from '@/shared/dev/hmrDispose';
import { trackModuleMaterial, untrackModuleMaterial } from '@/engine/performance/GpuResourceBudgetTracker';
import {
  claimMaterialForActiveScene,
  resetSceneGpuOwnershipForTests,
} from '@/engine/three/sceneGpuOwnership';

const moduleMaterials = new Set<THREE.MeshStandardMaterial>();
const sharedStandardMaterialCache = new Map<string, THREE.MeshStandardMaterial>();

function colorKey(value: THREE.ColorRepresentation | undefined, fallback: string): string {
  if (value instanceof THREE.Color) return value.getHexString();
  if (value === undefined) return fallback;
  return String(value);
}

function serializeStandardMaterialParams(params: THREE.MeshStandardMaterialParameters): string {
  const mapUuid =
    params.map && 'uuid' in params.map ? params.map.uuid : params.map ? 'map' : 'none';
  return [
    colorKey(params.color, 'ffffff'),
    params.roughness ?? 1,
    params.metalness ?? 0,
    params.transparent ? 1 : 0,
    params.opacity ?? 1,
    params.side ?? THREE.FrontSide,
    params.polygonOffset ? 1 : 0,
    params.polygonOffsetFactor ?? 0,
    params.polygonOffsetUnits ?? 0,
    colorKey(params.emissive, '000000'),
    params.emissiveIntensity ?? 1,
    params.toneMapped === false ? 0 : 1,
    mapUuid,
  ].join(':');
}

/** Register a module-level material for lifecycle disposal. Returns the same instance. */
export function registerModuleMaterial<T extends THREE.MeshStandardMaterial>(material: T): T {
  moduleMaterials.add(material);
  trackModuleMaterial(material);
  claimMaterialForActiveScene(material);
  return material;
}

/** True when material is tracked by the module registry (skip mesh-tree dispose). */
export function isRegistryManagedMaterial(material: THREE.Material): boolean {
  return moduleMaterials.has(material as THREE.MeshStandardMaterial);
}

export function disposeRegisteredModuleMaterial(material: THREE.Material): void {
  if (!(material instanceof THREE.MeshStandardMaterial)) return;
  if (!moduleMaterials.has(material)) return;
  untrackModuleMaterial(material);
  material.dispose();
  moduleMaterials.delete(material);
  for (const [key, cached] of sharedStandardMaterialCache) {
    if (cached === material) {
      sharedStandardMaterialCache.delete(key);
    }
  }
}

/**
 * AAA Pass: auto de-plasticize any procedural shared material.
 * Clamp envMapIntensity, enforce roughness floor, reduce metalness for organic names.
 */
function aaaDeplasticizeParams(params: THREE.MeshStandardMaterialParameters): THREE.MeshStandardMaterialParameters {
  const nameHint = `${params.name ?? ''} ${params.color ?? ''}`.toLowerCase();
  const isOrganic =
    /skin|cloth|wood|fabric|plaster|wall|concrete|brick|paper|book|cotton|denim|leather/.test(nameHint) ||
    typeof params.color === 'string';

  const out = { ...params };

  // Always lower env response — plastic shine = high envMapIntensity on Standard
  if (out.envMapIntensity === undefined) {
    out.envMapIntensity = isOrganic ? 0.22 : 0.32;
  } else {
    out.envMapIntensity = Math.min(out.envMapIntensity, isOrganic ? 0.32 : 0.45);
  }

  // Roughness floor — never go below 0.55 for organic tissue
  const ro = out.roughness ?? 0.8;
  out.roughness = Math.max(isOrganic ? 0.62 : 0.45, ro);

  // Metalness ceiling — cloth/wood should not be metallic
  if (out.metalness !== undefined) {
    out.metalness = Math.min(out.metalness, isOrganic ? 0.12 : 0.45);
  } else {
    out.metalness = isOrganic ? 0.03 : 0.08;
  }

  // Emissive too bright = neon plastic
  if (out.emissiveIntensity !== undefined && out.emissiveIntensity > 0.6) {
    out.emissiveIntensity = Math.min(out.emissiveIntensity, 0.45);
  }

  return out;
}

export function getSharedStandardMaterial(
  params: THREE.MeshStandardMaterialParameters,
): THREE.MeshStandardMaterial {
  const aaaParams = aaaDeplasticizeParams(params);
  const key = serializeStandardMaterialParams(aaaParams);
  const cached = sharedStandardMaterialCache.get(key);
  if (cached && moduleMaterials.has(cached)) {
    claimMaterialForActiveScene(cached);
    return cached;
  }

  const material = registerModuleMaterial(new THREE.MeshStandardMaterial(aaaParams));
  sharedStandardMaterialCache.set(key, material);
  return material;
}

/** Shorthand for color-first shared materials with optional PBR overrides. */
export function mat(
  color: string,
  overrides: Omit<THREE.MeshStandardMaterialParameters, 'color'> = {},
): THREE.MeshStandardMaterial {
  return getSharedStandardMaterial({ color, ...overrides });
}

export function disposeAllModuleMaterials(): void {
  for (const material of moduleMaterials) {
    untrackModuleMaterial(material);
    material.dispose();
  }
  moduleMaterials.clear();
  sharedStandardMaterialCache.clear();
  resetSceneGpuOwnershipForTests();
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
