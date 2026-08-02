import { describe, expect, it } from 'vitest';
import { allowsHeavyGfxFeature } from './qualityFeatureGates';

describe('allowsHeavyGfxFeature', () => {
  it('never enables heavy features on auto', () => {
    expect(allowsHeavyGfxFeature('auto', 'n8ao')).toBe(false);
    expect(allowsHeavyGfxFeature('auto', 'reflector')).toBe(false);
    expect(allowsHeavyGfxFeature('auto', 'galaxySky')).toBe(false);
    expect(allowsHeavyGfxFeature('auto', 'meshPhysicalWet')).toBe(false);
  });

  it('enables n8ao and galaxy on high+', () => {
    expect(allowsHeavyGfxFeature('high', 'n8ao')).toBe(true);
    expect(allowsHeavyGfxFeature('high', 'galaxySky')).toBe(true);
    expect(allowsHeavyGfxFeature('high', 'reflector')).toBe(true);
  });

  it('allows reflector on medium but not n8ao/galaxy', () => {
    expect(allowsHeavyGfxFeature('medium', 'reflector')).toBe(true);
    expect(allowsHeavyGfxFeature('medium', 'n8ao')).toBe(false);
    expect(allowsHeavyGfxFeature('medium', 'galaxySky')).toBe(false);
    expect(allowsHeavyGfxFeature('medium', 'godRays')).toBe(false);
    expect(allowsHeavyGfxFeature('medium', 'meshPhysicalWet')).toBe(false);
  });

  it('gates godRays to high+', () => {
    expect(allowsHeavyGfxFeature('auto', 'godRays')).toBe(false);
    expect(allowsHeavyGfxFeature('high', 'godRays')).toBe(true);
  });

  it('gates selective MeshPhysical wet to high/ultra only', () => {
    expect(allowsHeavyGfxFeature('high', 'meshPhysicalWet')).toBe(true);
    expect(allowsHeavyGfxFeature('ultra', 'meshPhysicalWet')).toBe(true);
    expect(allowsHeavyGfxFeature('medium', 'meshPhysicalWet')).toBe(false);
    expect(allowsHeavyGfxFeature('low', 'meshPhysicalWet')).toBe(false);
  });

  it('enables all heavy features on ultra', () => {
    expect(allowsHeavyGfxFeature('ultra', 'n8ao')).toBe(true);
    expect(allowsHeavyGfxFeature('ultra', 'reflector')).toBe(true);
    expect(allowsHeavyGfxFeature('ultra', 'galaxySky')).toBe(true);
    expect(allowsHeavyGfxFeature('ultra', 'godRays')).toBe(true);
    expect(allowsHeavyGfxFeature('ultra', 'meshPhysicalWet')).toBe(true);
    expect(allowsHeavyGfxFeature('ultra', 'ssrWetStreets')).toBe(true);
  });

  it('gates ssrWetStreets to ultra only (never on medium/high)', () => {
    expect(allowsHeavyGfxFeature('auto', 'ssrWetStreets')).toBe(false);
    expect(allowsHeavyGfxFeature('low', 'ssrWetStreets')).toBe(false);
    expect(allowsHeavyGfxFeature('medium', 'ssrWetStreets')).toBe(false);
    expect(allowsHeavyGfxFeature('high', 'ssrWetStreets')).toBe(false);
    expect(allowsHeavyGfxFeature('ultra', 'ssrWetStreets')).toBe(true);
    expect(allowsHeavyGfxFeature('ultra', 'ssrWetStreets', { coarsePointer: true })).toBe(false);
  });

  it('disables reflector/godRays/meshPhysicalWet/ssrWetStreets on coarse pointer', () => {
    expect(allowsHeavyGfxFeature('ultra', 'reflector', { coarsePointer: true })).toBe(false);
    expect(allowsHeavyGfxFeature('high', 'reflector', { coarsePointer: true })).toBe(false);
    expect(allowsHeavyGfxFeature('medium', 'reflector', { coarsePointer: true })).toBe(false);
    expect(allowsHeavyGfxFeature('ultra', 'godRays', { coarsePointer: true })).toBe(false);
    expect(allowsHeavyGfxFeature('ultra', 'meshPhysicalWet', { coarsePointer: true })).toBe(false);
    expect(allowsHeavyGfxFeature('ultra', 'ssrWetStreets', { coarsePointer: true })).toBe(false);
    expect(allowsHeavyGfxFeature('ultra', 'n8ao', { coarsePointer: true })).toBe(true);
  });
});
