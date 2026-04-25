import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { estimateObject3DGpuBytes } from './gltfByteEstimate';

describe('estimateObject3DGpuBytes', () => {
  it('counts buffer geometry attributes', () => {
    const g = new THREE.BoxGeometry(1, 1, 1);
    const m = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const mesh = new THREE.Mesh(g, m);
    const root = new THREE.Group();
    root.add(mesh);
    const n = estimateObject3DGpuBytes(root);
    expect(n).toBeGreaterThanOrEqual(64_000);
  });

  it('adds rough bytes for a small texture map', () => {
    const data = new Uint8Array(256 * 256 * 4);
    const tex = new THREE.DataTexture(data, 256, 256);
    tex.needsUpdate = true;
    const m = new THREE.MeshStandardMaterial({ map: tex });
    const g = new THREE.PlaneGeometry(1, 1);
    const mesh = new THREE.Mesh(g, m);
    const root = new THREE.Group();
    root.add(mesh);
    const n = estimateObject3DGpuBytes(root);
    expect(n).toBeGreaterThan(64_000);
    expect(n).toBeLessThanOrEqual(250_000_000);
  });
});
