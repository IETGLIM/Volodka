import { describe, it, expect } from 'vitest';
import {
  MAX_PHYSICS_DT,
  MAX_PHYSICS_STEPS,
  RAPIER_PHYSICS_TIMESTEP,
  getPhysicsSubstepCount,
} from './physicsSubstep';

describe('physicsSubstep', () => {
  it('aligns KCC max step with Rapier physics timestep', () => {
    expect(MAX_PHYSICS_DT).toBeGreaterThanOrEqual(RAPIER_PHYSICS_TIMESTEP);
    expect(MAX_PHYSICS_DT / RAPIER_PHYSICS_TIMESTEP).toBeCloseTo(2, 5);
  });

  it('uses a single step at 60fps', () => {
    expect(getPhysicsSubstepCount(1 / 60)).toBe(1);
  });

  it('sub-steps when delta exceeds MAX_PHYSICS_DT', () => {
    expect(getPhysicsSubstepCount(0.05)).toBe(2);
    expect(getPhysicsSubstepCount(MAX_PHYSICS_DT * 2)).toBe(2);
  });

  it('caps sub-steps to avoid spiral of death', () => {
    expect(getPhysicsSubstepCount(1)).toBe(MAX_PHYSICS_STEPS);
    expect(getPhysicsSubstepCount(0.2)).toBe(MAX_PHYSICS_STEPS);
  });
});
