import { describe, expect, it } from 'vitest';
import { sampleAmbientCrowdSilhouette } from './ambientCrowdImpostorTexture';

describe('ambientCrowdImpostorTexture', () => {
  it('has opaque torso/head and empty corners', () => {
    expect(sampleAmbientCrowdSilhouette(0.5, 0.5)).toBeGreaterThan(0.8);
    expect(sampleAmbientCrowdSilhouette(0.5, 0.82)).toBeGreaterThan(0.8);
    expect(sampleAmbientCrowdSilhouette(0.05, 0.05)).toBe(0);
    expect(sampleAmbientCrowdSilhouette(0.95, 0.95)).toBe(0);
  });
});
