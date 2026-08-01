import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { weatherEnvironmentMaterials } from './weatherEnvironmentMaterials';

describe('weatherEnvironmentMaterials', () => {
  it('pulls plaza kits away from mirror IBL', () => {
    const root = new THREE.Group();
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({
        roughness: 0.35,
        metalness: 0.9,
        envMapIntensity: 1.2,
      }),
    );
    root.add(mesh);

    weatherEnvironmentMaterials(root, 'plaza', { applyMaps: true });
    const mat = mesh.material as THREE.MeshStandardMaterial;
    expect(mat.envMapIntensity).toBeLessThanOrEqual(0.55);
    expect(mat.roughness).toBeGreaterThanOrEqual(0.58);
    expect(mat.metalness).toBeLessThanOrEqual(0.45);
    expect(mat.map).toBeTruthy();
    expect(mat.normalMap).toBeTruthy();
    expect(mat.roughnessMap).toBeTruthy();
  });

  it('skips wear maps on small props when applyMaps is false', () => {
    const root = new THREE.Group();
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.2, 0.2),
      new THREE.MeshStandardMaterial({ roughness: 0.4, envMapIntensity: 1 }),
    );
    root.add(mesh);
    weatherEnvironmentMaterials(root, 'prop', { applyMaps: false });
    const mat = mesh.material as THREE.MeshStandardMaterial;
    expect(mat.map).toBeNull();
    expect(mat.envMapIntensity).toBeLessThanOrEqual(0.55);
  });
});


