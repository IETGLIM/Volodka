import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import {
  FPS_METER_FULL_BODY_MIN_EXTENT_M,
  FPS_PROCEDURAL_RIG_SCALE,
  FULL_BODY_INTERIM_MIN_HEIGHT_UNITS,
  resolveFpsArmsPresentation,
  rigHasTorsoBones,
} from './fpsArmsPresentation';

function boxMesh(width: number, height: number, depth: number, y = height / 2): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth));
  mesh.position.y = y;
  return mesh;
}

describe('resolveFpsArmsPresentation', () => {
  it('uses procedural fingers at 0.012 and glbScale 1 for meter-normalized Soldier interim', () => {
    const root = new THREE.Group();
    root.name = 'Character';
    root.scale.setScalar(0.01);
    root.add(boxMesh(1.84, 0.44, 1.83));
    const hips = new THREE.Bone();
    hips.name = 'mixamorig:Hips';
    root.add(hips);

    const result = resolveFpsArmsPresentation(root);

    expect(result.proceduralOnly).toBe(true);
    expect(result.glbScale).toBe(1);
    expect(result.fingerScale).toBe(FPS_PROCEDURAL_RIG_SCALE);
    expect(rigHasTorsoBones(root)).toBe(true);
  });

  it('uses legacy 0.012 glbScale for raw 100+ unit exports', () => {
    const root = new THREE.Group();
    root.add(boxMesh(90, FULL_BODY_INTERIM_MIN_HEIGHT_UNITS + 90, 40));

    const result = resolveFpsArmsPresentation(root);

    expect(result.proceduralOnly).toBe(true);
    expect(result.glbScale).toBe(FPS_PROCEDURAL_RIG_SCALE);
    expect(result.fingerScale).toBe(FPS_PROCEDURAL_RIG_SCALE);
  });

  it('shows meter-scale dedicated arms at glbScale 1 when finger meshes exist', () => {
    const root = new THREE.Group();
    for (const name of ['left_index', 'left_thumb', 'right_index', 'right_thumb']) {
      const mesh = boxMesh(0.04, 0.08, 0.02);
      mesh.name = name;
      root.add(mesh);
    }

    const result = resolveFpsArmsPresentation(root);

    expect(result.proceduralOnly).toBe(false);
    expect(result.glbScale).toBe(1);
    expect(result.fingerScale).toBe(FPS_PROCEDURAL_RIG_SCALE);
  });

  it('keeps procedural fallback for small meter arms without finger mesh names', () => {
    const root = new THREE.Group();
    root.add(boxMesh(0.35, 0.12, 0.25));

    const result = resolveFpsArmsPresentation(root);

    expect(result.proceduralOnly).toBe(true);
    expect(result.glbScale).toBe(1);
    expect(Math.max(0.35, 0.12, 0.25)).toBeLessThan(FPS_METER_FULL_BODY_MIN_EXTENT_M);
  });
});
