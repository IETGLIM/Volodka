import { describe, it, expect } from 'vitest';
import { followCameraCollisionDamp, followCameraSmoothDamp } from './followCameraDamp';

describe('followCameraDamp', () => {
  it('smooth damp is in (0,1) for positive delta', () => {
    const t = followCameraSmoothDamp(0.1, 1 / 60);
    expect(t).toBeGreaterThan(0);
    expect(t).toBeLessThan(1);
  });

  it('smooth damp increases with smoothness at fixed dt', () => {
    const dt = 1 / 60;
    const low = followCameraSmoothDamp(0.05, dt);
    const high = followCameraSmoothDamp(0.2, dt);
    expect(high).toBeGreaterThan(low);
  });

  it('collision damp matches lambda = collisionSpring', () => {
    const dt = 1 / 60;
    const k = 12;
    expect(followCameraCollisionDamp(k, dt)).toBeCloseTo(1 - Math.exp(-k * dt), 10);
  });
});
