import * as THREE from 'three';
import {
  disposeObject3DTree,
  type DisposeThreeSkipSets,
} from '@/engine/three/disposeThreeResources';

function collectTemplateSharedResources(template: THREE.Object3D): DisposeThreeSkipSets {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();

  template.traverse((child) => {
    if (
      child instanceof THREE.Mesh
      || child instanceof THREE.SkinnedMesh
      || child instanceof THREE.InstancedMesh
      || child instanceof THREE.Points
      || child instanceof THREE.Line
      || child instanceof THREE.LineSegments
      || child instanceof THREE.Sprite
    ) {
      if (child.geometry) geometries.add(child.geometry);
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      for (const mat of mats) {
        if (mat) materials.add(mat);
      }
    }
  });

  return { geometries, materials };
}

/**
 * One baked template Group per NPC/enemy definition — instances clone this tree
 * and only update transform / animation (shared geometry + materials).
 */
const npcTemplateCache = new Map<string, THREE.Group>();

export function getNpcTemplate(definitionId: string): THREE.Group | undefined {
  return npcTemplateCache.get(definitionId);
}

export function registerNpcTemplate(definitionId: string, template: THREE.Group): THREE.Group {
  const existing = npcTemplateCache.get(definitionId);
  if (existing) return existing;
  template.matrixAutoUpdate = false;
  template.updateMatrix();
  npcTemplateCache.set(definitionId, template);
  return template;
}

/** Deep clone for placement — geometries/materials stay shared on the template. */
export function cloneNpcTemplate(definitionId: string): THREE.Group | null {
  const template = npcTemplateCache.get(definitionId);
  if (!template) return null;
  const instance = template.clone(true);
  instance.matrixAutoUpdate = true;
  return instance;
}

/**
 * Dispose a template clone without tearing down shared template GPU resources.
 * Pass the baked template or its definition id.
 */
export function disposeNpcInstance(
  instance: THREE.Object3D | null | undefined,
  templateOrDefinitionId: THREE.Object3D | string,
): void {
  if (!instance) return;

  const template =
    typeof templateOrDefinitionId === 'string'
      ? npcTemplateCache.get(templateOrDefinitionId)
      : templateOrDefinitionId;

  if (!template) {
    disposeObject3DTree(instance);
    return;
  }

  disposeObject3DTree(instance, {
    skip: collectTemplateSharedResources(template),
  });
}

export function disposeNpcTemplate(definitionId: string): void {
  const template = npcTemplateCache.get(definitionId);
  if (!template) return;
  disposeObject3DTree(template);
  npcTemplateCache.delete(definitionId);
}

/** Drop baked NPC templates so GLB reload picks up the new quality tier. */
export function evictNpcTemplateCache(): void {
  for (const id of [...npcTemplateCache.keys()]) {
    disposeNpcTemplate(id);
  }
}

/** Test-only reset */
export function clearNpcTemplateCacheForTests(): void {
  evictNpcTemplateCache();
}
