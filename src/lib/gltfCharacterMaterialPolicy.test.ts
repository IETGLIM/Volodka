import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  applyGltfCharacterDepthWrite,
  applyGltfExplorationCharacterMaterialPolicies,
  applyGltfHairLikeAlphaTestCutout,
  applyGltfMeshesFrustumCullOff,
  computeExplorationCharacterMeshUnionVerticalExtent,
} from './gltfCharacterMaterialPolicy';

describe('gltfCharacterMaterialPolicy', () => {
  it('computeExplorationCharacterMeshUnionVerticalExtent uses geometry bounds', () => {
    const root = new THREE.Group();
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 3, 1), new THREE.MeshBasicMaterial());
    root.add(mesh);
    expect(computeExplorationCharacterMeshUnionVerticalExtent(root)).toBeCloseTo(3, 5);
  });

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
    expect(mesh.frustumCulled).toBe(false);
    expect(typeof root.userData.characterBoundingVerticalM).toBe('number');
    expect(root.userData.characterBoundingVerticalM).toBeGreaterThan(0);
    expect(root.userData.characterHeightM).toBeUndefined();
  });

  it('applyGltfExplorationCharacterMaterialPolicies writes characterHeightM when uniform passed', () => {
    const root = new THREE.Group();
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 1), new THREE.MeshBasicMaterial());
    root.add(mesh);
    applyGltfExplorationCharacterMaterialPolicies(root, { explorationVisualUniform: 0.5 });
    expect(root.userData.characterBoundingVerticalM).toBeGreaterThan(0);
    expect(root.userData.characterHeightM).toBeCloseTo(
      root.userData.characterBoundingVerticalM * 0.5,
      5,
    );
  });

  it('applyGltfMeshesFrustumCullOff disables frustum culling on meshes', () => {
    const root = new THREE.Group();
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
    mesh.frustumCulled = true;
    root.add(mesh);
    applyGltfMeshesFrustumCullOff(root);
    expect(mesh.frustumCulled).toBe(false);
  });

  it('applyGltfCharacterDepthWrite clears polygonOffset on materials', () => {
    const root = new THREE.Group();
    const m = new THREE.MeshStandardMaterial({
      color: 0x00ff00,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -3,
      polygonOffsetUnits: -2,
    });
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(), m);
    root.add(mesh);
    applyGltfCharacterDepthWrite(root);
    expect(m.polygonOffset).toBe(false);
    expect(m.polygonOffsetFactor).toBe(0);
    expect(m.polygonOffsetUnits).toBe(0);
  });

  it('applyGltfHairLikeAlphaTestCutout matches material name', () => {
    const root = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({
      name: 'Character_Eyelash_MAT',
      transparent: true,
      opacity: 0.5,
    });
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(), mat);
    mesh.name = 'Submesh_12';
    root.add(mesh);
    applyGltfHairLikeAlphaTestCutout(root);
    expect(mat.transparent).toBe(false);
    expect(mat.alphaTest).toBe(0.42);
  });
});
