import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  DESK_POSITION,
  STAND_POSITION,
  facingYBetween,
  facingYFromDirection,
} from './wakeUpCinematic';

describe('wakeUpCinematic facing helpers', () => {
  it('faces -Z when moving along -Z', () => {
    expect(facingYFromDirection(0, -1)).toBeCloseTo(Math.PI, 5);
  });

  it('faces +Z when moving along +Z', () => {
    expect(facingYFromDirection(0, 1)).toBeCloseTo(0, 5);
  });

  it('walk from stand to desk faces toward desk, not backward (+Z)', () => {
    const facing = facingYBetween(STAND_POSITION, DESK_POSITION);
    // Desk is generally -Z of stand in room layout — facing should be near ±π.
    expect(Math.abs(facing)).toBeGreaterThan(Math.PI / 2);
  });

  it('sit slide from desk to chair faces toward chair', () => {
    const facing = facingYBetween(DESK_POSITION, new THREE.Vector3(0, 0, -1.3));
    expect(Math.abs(facing)).toBeGreaterThan(Math.PI / 2);
  });

  // Regression: yaw must match +Z-facing models with FORWARD_OFFSET=0
  // (CesiumPlayerModel / ProceduralPlayerModelLite / playerMainMovement).
  it('faces +X correctly when moving along +X (not backwards)', () => {
    const facing = facingYFromDirection(1, 0);
    const forwardX = Math.sin(facing);
    const forwardZ = Math.cos(facing);
    expect(forwardX).toBeGreaterThan(0.99);
    expect(Math.abs(forwardZ)).toBeLessThan(0.01);
  });

  it('faces -X correctly when moving along -X (not backwards)', () => {
    const facing = facingYFromDirection(-1, 0);
    const forwardX = Math.sin(facing);
    expect(forwardX).toBeLessThan(-0.99);
  });
});
