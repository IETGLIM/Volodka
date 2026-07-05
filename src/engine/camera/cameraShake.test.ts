import { describe, expect, it, beforeEach } from 'vitest';
import {
  getCameraShakeIntensity,
  getCameraShakeOffset,
  resetCameraShake,
  triggerCameraShake,
} from './cameraShake';

describe('cameraShake', () => {
  beforeEach(() => {
    resetCameraShake();
  });

  it('decays shake intensity over time', () => {
    triggerCameraShake(0.2, 5);
    getCameraShakeOffset(0.1);
    expect(getCameraShakeIntensity()).toBeLessThan(0.2);
    expect(Number.isFinite(getCameraShakeIntensity())).toBe(true);
  });

  it('recovers from NaN intensity instead of shaking forever', () => {
    triggerCameraShake(Number.NaN, 5);
    const offset = getCameraShakeOffset(1 / 60);
    expect(offset.x).toBe(0);
    expect(offset.y).toBe(0);
    expect(getCameraShakeIntensity()).toBe(0);
  });

  it('ignores NaN decay without poisoning shake', () => {
    triggerCameraShake(0.2, Number.NaN);
    getCameraShakeOffset(1 / 60);
    expect(getCameraShakeIntensity()).toBeGreaterThan(0);
    expect(Number.isFinite(getCameraShakeIntensity())).toBe(true);
  });

  it('ignores non-finite dt without poisoning intensity', () => {
    triggerCameraShake(0.2, 5);
    getCameraShakeOffset(Number.NaN);
    expect(Number.isFinite(getCameraShakeIntensity())).toBe(true);
    expect(getCameraShakeIntensity()).toBeGreaterThan(0);
  });
});
