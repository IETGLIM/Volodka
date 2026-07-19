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
    expect(facingYFromDirection(0, -1)).toBeCloseTo(0, 5);
  });

  it('faces +Z when moving along +Z', () => {
    expect(facingYFromDirection(0, 1)).toBeCloseTo(Math.PI, 5);
  });

  it('walk from stand to desk faces toward desk, not backward (+Z)', () => {
    const facing = facingYBetween(STAND_POSITION, DESK_POSITION);
    expect(Math.abs(facing)).toBeLessThan(Math.PI / 2);
    expect(facing).not.toBeCloseTo(Math.PI, 1);
  });

  it('sit slide from desk to chair faces toward chair', () => {
    const facing = facingYBetween(DESK_POSITION, new THREE.Vector3(0, 0, -1.3));
    expect(Math.abs(facing)).toBeLessThan(0.2);
  });

  // Regression test: facingYFromDirection had a sign error on the X axis —
  // atan2(dx, -dz) returned π/2 for +X movement, but the correct yaw (after
  // FORWARD_OFFSET=π) should make the model face +X. With the fix
  // atan2(0-dx, 0-dz), +X movement gives -π/2, which + π = π/2 → model faces +X.
  it('faces +X correctly when moving along +X (not backwards)', () => {
    const facing = facingYFromDirection(1, 0);
    // facing + π should put the +Z-facing model toward +X
    const totalRotation = facing + Math.PI;
    // Model forward after rotation = (sin(θ), 0, cos(θ))
    const forwardX = Math.sin(totalRotation);
    const forwardZ = Math.cos(totalRotation);
    expect(forwardX).toBeGreaterThan(0.99); // ~+1
    expect(Math.abs(forwardZ)).toBeLessThan(0.01); // ~0
  });

  it('faces -X correctly when moving along -X (not backwards)', () => {
    const facing = facingYFromDirection(-1, 0);
    const totalRotation = facing + Math.PI;
    const forwardX = Math.sin(totalRotation);
    expect(forwardX).toBeLessThan(-0.99); // ~-1
  });
});
