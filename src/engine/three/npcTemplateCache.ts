import * as THREE from 'three';
import { disposeObject3DTree } from '@/engine/three/disposeThreeResources';

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

export function disposeNpcTemplate(definitionId: string): void {
  const template = npcTemplateCache.get(definitionId);
  if (!template) return;
  disposeObject3DTree(template);
  npcTemplateCache.delete(definitionId);
}

/** Test-only reset */
export function clearNpcTemplateCacheForTests(): void {
  for (const id of [...npcTemplateCache.keys()]) {
    disposeNpcTemplate(id);
  }
}
