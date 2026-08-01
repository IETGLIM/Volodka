import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { deplasticizeCharacterMaterials } from './deplasticizeCharacterMaterials';

describe('deplasticizeCharacterMaterials', () => {
  it('raises roughness and tames metal/env on kit plastic mats', () => {
    const root = new THREE.Group();
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({
        name: 'Hoodie_Mat',
        roughness: 0.35,
        metalness: 0.55,
        envMapIntensity: 1.4,
        emissiveIntensity: 0.9,
        flatShading: true,
      }),
    );
    root.add(mesh);

    deplasticizeCharacterMaterials(root);

    const mat = mesh.material as THREE.MeshStandardMaterial;
    expect(mat.roughness).toBeGreaterThanOrEqual(0.72);
    expect(mat.metalness).toBeLessThanOrEqual(0.18);
    expect(mat.envMapIntensity).toBeLessThanOrEqual(0.55);
    expect(mat.emissiveIntensity).toBeLessThanOrEqual(0.42);
    expect(mat.flatShading).toBe(false);
  });

  it('keeps metal kit parts more metallic but still worn', () => {
    const root = new THREE.Group();
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.2, 0.2),
      new THREE.MeshStandardMaterial({
        name: 'Weapon_Metal',
        roughness: 0.2,
        metalness: 0.9,
      }),
    );
    root.add(mesh);

    deplasticizeCharacterMaterials(root);
    const mat = mesh.material as THREE.MeshStandardMaterial;
    expect(mat.metalness).toBeGreaterThanOrEqual(0.35);
    expect(mat.roughness).toBeLessThanOrEqual(0.55);
  });
});
