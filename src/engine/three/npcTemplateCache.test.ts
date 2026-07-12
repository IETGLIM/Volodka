import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as THREE from 'three';
import {
  clearNpcTemplateCacheForTests,
  cloneNpcTemplate,
  disposeNpcInstance,
  registerNpcTemplate,
} from '@/engine/three/npcTemplateCache';

describe('disposeNpcInstance', () => {
  beforeEach(() => {
    clearNpcTemplateCacheForTests();
  });

  it('skips shared template geometry and materials when disposing a clone', () => {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: '#fff' });
    const mesh = new THREE.Mesh(geometry, material);
    const template = new THREE.Group();
    template.add(mesh);
    registerNpcTemplate('npc-test', template);

    const instance = cloneNpcTemplate('npc-test');
    expect(instance).not.toBeNull();

    vi.spyOn(geometry, 'dispose');
    vi.spyOn(material, 'dispose');

    disposeNpcInstance(instance, template);

    expect(geometry.dispose).not.toHaveBeenCalled();
    expect(material.dispose).not.toHaveBeenCalled();
  });

  it('accepts a definition id and still skips shared template resources', () => {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: '#fff' });
    const mesh = new THREE.Mesh(geometry, material);
    const template = new THREE.Group();
    template.add(mesh);
    registerNpcTemplate('npc-by-id', template);

    const instance = cloneNpcTemplate('npc-by-id');
    expect(instance).not.toBeNull();

    vi.spyOn(geometry, 'dispose');
    vi.spyOn(material, 'dispose');

    disposeNpcInstance(instance, 'npc-by-id');

    expect(geometry.dispose).not.toHaveBeenCalled();
    expect(material.dispose).not.toHaveBeenCalled();
  });

  it('disposes instance-only resources while keeping template assets alive', () => {
    const sharedGeometry = new THREE.BoxGeometry(1, 1, 1);
    const sharedMaterial = new THREE.MeshStandardMaterial({ color: '#fff' });
    const templateMesh = new THREE.Mesh(sharedGeometry, sharedMaterial);
    const template = new THREE.Group();
    template.add(templateMesh);
    registerNpcTemplate('npc-mixed', template);

    const instance = cloneNpcTemplate('npc-mixed');
    expect(instance).not.toBeNull();

    const instanceOnlyGeometry = new THREE.SphereGeometry(0.5, 8, 8);
    const instanceOnlyMaterial = new THREE.MeshStandardMaterial({ color: '#000' });
    const instanceOnlyMesh = new THREE.Mesh(instanceOnlyGeometry, instanceOnlyMaterial);
    instance!.add(instanceOnlyMesh);

    vi.spyOn(sharedGeometry, 'dispose');
    vi.spyOn(sharedMaterial, 'dispose');
    vi.spyOn(instanceOnlyGeometry, 'dispose');
    vi.spyOn(instanceOnlyMaterial, 'dispose');

    disposeNpcInstance(instance, template);

    expect(sharedGeometry.dispose).not.toHaveBeenCalled();
    expect(sharedMaterial.dispose).not.toHaveBeenCalled();
    expect(instanceOnlyGeometry.dispose).toHaveBeenCalled();
    expect(instanceOnlyMaterial.dispose).toHaveBeenCalled();
  });
});
