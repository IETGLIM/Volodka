import { describe, expect, it } from 'vitest';
import { BoxGeometry, Group, Mesh, MeshStandardMaterial } from 'three';
import { getModelDimensions, normalizePropHeight, normalizePropMaxExtent } from '@/lib/explorationPropNormalize';

function boxMesh(sx: number, sy: number, sz: number): Mesh {
  const g = new BoxGeometry(sx, sy, sz);
  const m = new MeshStandardMaterial();
  return new Mesh(g, m);
}

describe('explorationPropNormalize', () => {
  it('normalizePropHeight scales uniformly to match target height', () => {
    const root = new Group();
    root.add(boxMesh(1, 2, 1));
    root.scale.set(1, 1, 1);
    normalizePropHeight(root, 1, true);
    root.updateMatrixWorld(true);
    const { height } = getModelDimensions(root);
    expect(height).toBeCloseTo(1, 5);
    expect(root.scale.x).toBeCloseTo(0.5, 5);
    expect(root.scale.y).toBeCloseTo(0.5, 5);
    expect(root.scale.z).toBeCloseTo(0.5, 5);
  });

  it('normalizePropHeight no-op when target invalid', () => {
    const root = new Group();
    root.add(boxMesh(1, 1, 1));
    normalizePropHeight(root, 0, true);
    expect(root.scale.x).toBe(1);
  });

  it('getModelDimensions returns bbox size', () => {
    const root = new Group();
    root.add(boxMesh(0.8, 0.75, 0.5));
    const d = getModelDimensions(root);
    expect(d.height).toBeCloseTo(0.75, 5);
    expect(d.width).toBeCloseTo(0.8, 5);
    expect(d.depth).toBeCloseTo(0.5, 5);
  });

  it('normalizePropMaxExtent clamps largest axis', () => {
    const root = new Group();
    root.add(boxMesh(1, 0.5, 2));
    normalizePropMaxExtent(root, 1, true);
    root.updateMatrixWorld(true);
    const d = getModelDimensions(root);
    expect(Math.max(d.width, d.height, d.depth)).toBeCloseTo(1, 5);
  });
});
