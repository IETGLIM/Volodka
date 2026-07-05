import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { deepCloneWithSkeletons } from '@/utils/deepCloneWithSkeletons';
import {
  CHARACTER_MIN_TRUSTED_HEIGHT_M,
  CHARACTER_TARGET_HEIGHT_M,
  fitCharacterGltf,
  measureCharacterGltfBounds,
} from './gltfScale';

const ALBERT_GLB = path.resolve(import.meta.dirname, '../../../public/models/npcs/albert.glb');

function loadGltfScene(file: string): Promise<{ scene: THREE.Group }> {
  const buf = readFileSync(file);
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  return new Promise((resolve, reject) => {
    loader.parse(
      buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
      '',
      (gltf) => resolve(gltf),
      reject,
    );
  });
}

describe('Quaternius NPC GLB prod smoke', () => {
  it('unions modular skinned slices for humanoid height', async () => {
    const { scene } = await loadGltfScene(ALBERT_GLB);
    const clone = deepCloneWithSkeletons(scene);
    clone.updateWorldMatrix(true, true);

    const characterBounds = measureCharacterGltfBounds(clone);

    expect(characterBounds.size.y).toBeGreaterThan(CHARACTER_MIN_TRUSTED_HEIGHT_M);

    const fit = fitCharacterGltf(characterBounds);
    expect(fit.scale).toBeGreaterThan(0.75);
    expect(fit.scale).toBeLessThan(1.25);
    expect(characterBounds.size.y * fit.scale).toBeCloseTo(CHARACTER_TARGET_HEIGHT_M, 1);
    expect(fit.footY).toBeGreaterThanOrEqual(-0.05);
    // Albert GLB has a non-zero origin offset; footY accounts for it.
    // The exact value depends on the model's bounding box — just verify
    // it's a reasonable positive offset (not NaN, not absurdly large).
    expect(fit.footY).toBeLessThan(1.5);
  });

  it('keeps feet on ground after skinned clone (runtime path)', async () => {
    const { scene } = await loadGltfScene(ALBERT_GLB);
    const clone = deepCloneWithSkeletons(scene);
    const bounds = measureCharacterGltfBounds(clone);
    const fit = fitCharacterGltf(bounds, { scaleMultiplier: 1 });

    expect(bounds.min.y * fit.scale + fit.footY).toBeCloseTo(0, 1);
  });
});
