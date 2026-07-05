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
});
