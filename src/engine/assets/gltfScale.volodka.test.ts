import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { deepCloneWithSkeletons } from '@/utils/deepCloneWithSkeletons';
import { fitCharacterGltf, measureGltfBounds } from './gltfScale';

function boxMesh(width: number, height: number, depth: number): THREE.Mesh {
  const geometry = new THREE.BoxGeometry(width, height, depth);
  const mesh = new THREE.Mesh(geometry);
  mesh.position.y = height / 2;
  return mesh;
}

const VOLODKA_GLB = path.resolve(
  import.meta.dirname,
  '../../../public/models/characters/volodka/volodka_lod0.glb',
);

function loadGltfScene(file: string): Promise<{ scene: import('three').Group }> {
  const buf = readFileSync(file);
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  // [KTX2] GLBs now contain KTX2 textures. In Node.js test env there's no
  // WebGL context, so mock the KTX2Loader — tests measure geometry bounds,
  // not texture pixels. Real KTX2Loader is used in browser via gltfPipeline.
  loader.setKTX2Loader({
    detectSupport: () => {},
    loadTexture: () => Promise.resolve(new THREE.Texture()),
    setTranscoderPath: () => this,
    setWorkerLimit: () => this,
  } as any);
  return new Promise((resolve, reject) => {
    loader.parse(
      buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
      '',
      (gltf) => resolve(gltf),
      reject,
    );
  });
}

describe('volodka player GLB scale', () => {
  it('measures full humanoid bounds and fits to ~1.75 m', async () => {
    const { scene } = await loadGltfScene(VOLODKA_GLB);
    scene.updateWorldMatrix(true, true);
    const bounds = measureGltfBounds(scene);
    const fit = fitCharacterGltf(bounds);

    expect(bounds.size.y).toBeGreaterThan(1.4);
    expect(bounds.size.y).toBeLessThan(2.2);
    expect(fit.scale).toBeGreaterThan(0.75);
    expect(fit.scale).toBeLessThan(1.25);
    expect(bounds.size.y * fit.scale).toBeCloseTo(1.75, 1);
  });

  it('keeps full bounds after skinned clone (runtime path)', async () => {
    const { scene } = await loadGltfScene(VOLODKA_GLB);
    const clone = deepCloneWithSkeletons(scene);
    clone.updateWorldMatrix(true, true);
    const bounds = measureGltfBounds(clone);
    const fit = fitCharacterGltf(bounds);

    expect(bounds.size.y).toBeGreaterThan(1.4);
    expect(fit.scale).toBeGreaterThan(0.75);
    expect(fit.scale).toBeLessThan(1.25);
  });

  it('does not explode scale when only the feet mesh slice is measured', () => {
    const feetOnly = new THREE.Group();
    feetOnly.add(boxMesh(0.38, 0.19, 0.28));
    const bounds = measureGltfBounds(feetOnly);
    const fit = fitCharacterGltf(bounds);
    expect(fit.scale).toBeLessThan(1.5);
  });
});
