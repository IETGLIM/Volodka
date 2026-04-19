import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  applyGltfCharacterDepthWrite,
  applyGltfExplorationCharacterMaterialPolicies,
  applyGltfHairLikeAlphaTestCutout,
} from './gltfCharacterMaterialPolicy';

describe('gltfCharacterMaterialPolicy', () => {
  it('applyGltfCharacterDepthWrite forces depthWrite on mesh materials', () => {
    const root = new THREE.Group();
    const m = new THREE.MeshStandardMaterial({ color: 0xff0000, depthWrite: false });
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(), m);
    root.add(mesh);
    applyGltfCharacterDepthWrite(root);
    expect(m.depthWrite).toBe(true);
  });

  it('applyGltfHairLikeAlphaTestCutout targets hair-named meshes', () => {
    const root = new THREE.Group();
    const hairMat = new THREE.MeshStandardMaterial({
      color: 0x333333,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    });
    const hair = new THREE.Mesh(new THREE.BoxGeometry(), hairMat);
    hair.name = 'Character_Hair';
    root.add(hair);

    const bodyMat = new THREE.MeshStandardMaterial({
      transparent: true,
      opacity: 0.5,
    });
    const body = new THREE.Mesh(new THREE.BoxGeometry(), bodyMat);
    body.name = 'Body';
    root.add(body);

    applyGltfHairLikeAlphaTestCutout(root);
    expect(hairMat.transparent).toBe(false);
    expect(hairMat.alphaTest).toBe(0.42);
    expect(hairMat.depthWrite).toBe(true);
    expect(bodyMat.transparent).toBe(true);
  });

  it('applyGltfExplorationCharacterMaterialPolicies runs depth then hair', () => {
    const root = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ transparent: true, opacity: 0.7, depthWrite: false });
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(), mat);
    mesh.name = 'Eyelashes';
    root.add(mesh);
    applyGltfExplorationCharacterMaterialPolicies(root);
    expect(mat.depthWrite).toBe(true);
    expect(mat.transparent).toBe(false);
    expect(mat.alphaTest).toBe(0.42);
  });
});
