import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  CHARACTER_MIN_TRUSTED_HEIGHT_M,
  CHARACTER_TARGET_HEIGHT_M,
  computeFootPivotY,
  computeInteriorBackdropScale,
  computePropUniformScale,
  fitCharacterGltf,
  fitPropGltf,
  measureGltfBounds,
} from './gltfScale';

function boxMesh(width: number, height: number, depth: number, y = 0): THREE.Mesh {
  const geometry = new THREE.BoxGeometry(width, height, depth);
  const mesh = new THREE.Mesh(geometry);
  mesh.position.y = y + height / 2;
  return mesh;
}

describe('gltfScale', () => {
  it('measures world-space bounds', () => {
    const mesh = boxMesh(2, 4, 1);
    const bounds = measureGltfBounds(mesh);
    expect(bounds.size.x).toBeCloseTo(2, 4);
    expect(bounds.size.y).toBeCloseTo(4, 4);
    expect(bounds.size.z).toBeCloseTo(1, 4);
    expect(bounds.min.y).toBeCloseTo(0, 4);
  });

  it('fits humanoid height to AAA target metres', () => {
    const mesh = boxMesh(1, 2, 0.5);
    const bounds = measureGltfBounds(mesh);
    const fit = fitCharacterGltf(bounds, { scaleMultiplier: 1 });
    expect(fit.scale).toBeCloseTo(CHARACTER_TARGET_HEIGHT_M / 2, 4);
    expect(fit.rotX).toBe(0);
    expect(fit.footY).toBeCloseTo(0, 4);
  });

  it('rotates Z-up humanoid exports before fitting', () => {
    const mesh = boxMesh(0.5, 1, 2);
    const bounds = measureGltfBounds(mesh);
    const fit = fitCharacterGltf(bounds);
    expect(fit.rotX).toBeCloseTo(-Math.PI / 2, 4);
    expect(fit.scale).toBeCloseTo(CHARACTER_TARGET_HEIGHT_M / 2, 4);
  });

  it('does not inflate modular boot slices to room scale', () => {
    const mesh = boxMesh(0.38, 0.19, 0.28);
    const bounds = measureGltfBounds(mesh);
    expect(bounds.size.y).toBeLessThan(CHARACTER_MIN_TRUSTED_HEIGHT_M);
    const fit = fitCharacterGltf(bounds);
    expect(fit.scale).toBeCloseTo(1, 4);
  });

  it('computes prop scale from target size box', () => {
    const bounds = measureGltfBounds(boxMesh(0.73, 0.38, 0.39));
    const scale = computePropUniformScale(bounds, [1.47, 0.77, 0.78], 'height');
    expect(scale).toBeCloseTo(0.77 / 0.38, 2);
  });

  it('combines target box fit with manual multiplier', () => {
    const bounds = measureGltfBounds(boxMesh(1, 1, 1));
    const fit = fitPropGltf(bounds, {
      targetSizeM: [2, 2, 2],
      fitAxis: 'height',
      manualScale: 0.5,
    });
    expect(fit.scale).toBeCloseTo(1, 4);
    expect(fit.footY).toBeCloseTo(0, 4);
  });

  it('foot pivot keeps mesh base on ground', () => {
    const bounds = measureGltfBounds(boxMesh(1, 2, 1, 0.5));
    expect(computeFootPivotY(bounds, 2)).toBeCloseTo(-1, 4);
  });

  it('scales interior backdrop to scene footprint', () => {
    const bounds = measureGltfBounds(boxMesh(1.3, 0.83, 1.03));
    const scale = computeInteriorBackdropScale(bounds, [5, 7]);
    expect(scale).toBeCloseTo(7 / 1.03, 2);
  });
});
