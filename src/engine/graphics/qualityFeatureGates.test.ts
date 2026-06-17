import { describe, expect, it } from 'vitest';
import { allowsHeavyGfxFeature } from './qualityFeatureGates';

describe('allowsHeavyGfxFeature', () => {
  it('blocks all heavy features on auto preset', () => {
    expect(allowsHeavyGfxFeature('auto', 'n8ao')).toBe(false);
    expect(allowsHeavyGfxFeature('auto', 'reflector')).toBe(false);
    expect(allowsHeavyGfxFeature('auto', 'galaxySky')).toBe(false);
  });

  it('allows N8AO, galaxy sky, and reflector on explicit high', () => {
    expect(allowsHeavyGfxFeature('high', 'n8ao')).toBe(true);
    expect(allowsHeavyGfxFeature('high', 'galaxySky')).toBe(true);
    expect(allowsHeavyGfxFeature('high', 'reflector')).toBe(true);
  });

  it('blocks god rays on auto preset', () => {
    expect(allowsHeavyGfxFeature('auto', 'godRays')).toBe(false);
    expect(allowsHeavyGfxFeature('high', 'godRays')).toBe(true);
  });

  it('allows all heavy features on explicit ultra', () => {
    expect(allowsHeavyGfxFeature('ultra', 'n8ao')).toBe(true);
    expect(allowsHeavyGfxFeature('ultra', 'reflector')).toBe(true);
    expect(allowsHeavyGfxFeature('ultra', 'galaxySky')).toBe(true);
    expect(allowsHeavyGfxFeature('ultra', 'godRays')).toBe(true);
  });

  it('caps high/ultra reflector and god rays on coarse-pointer devices', () => {
    expect(allowsHeavyGfxFeature('ultra', 'reflector', { coarsePointer: true })).toBe(false);
    expect(allowsHeavyGfxFeature('high', 'reflector', { coarsePointer: true })).toBe(false);
    expect(allowsHeavyGfxFeature('ultra', 'godRays', { coarsePointer: true })).toBe(false);
    expect(allowsHeavyGfxFeature('ultra', 'n8ao', { coarsePointer: true })).toBe(true);
  });
});
