import { describe, expect, it } from 'vitest';
import {
  getInteriorShellScale,
  getInteriorShellScaleAnisotropy,
  INTERIOR_SHELL_MOUNT_KIND,
  INTERIOR_SHELL_SOURCE_BOUNDS_M,
  isBackdropDressingShell,
  isExteriorBuildingShell,
  isWalkableInteriorShellAllowed,
} from './interiorShellScale';

describe('interiorShellScale', () => {
  it('allows the authored apartment envelope as a walkable bedroom mount', () => {
    expect(isWalkableInteriorShellAllowed('volodkaBedroom')).toBe(true);
    expect(INTERIOR_SHELL_MOUNT_KIND.volodkaBedroom).toBe('walkable_envelope');
    expect(isExteriorBuildingShell('volodkaBedroom')).toBe(false);
  });

  it('blocks Kenney exterior building impostors from walkable room mounts', () => {
    expect(isWalkableInteriorShellAllowed('cafe')).toBe(false);
    expect(isWalkableInteriorShellAllowed('office')).toBe(false);
    expect(isWalkableInteriorShellAllowed('library')).toBe(false);
    expect(isExteriorBuildingShell('cafe')).toBe(true);
    expect(isExteriorBuildingShell('office')).toBe(true);
  });

  it('cafe shell stays blocked so High prop dressing cannot own the walkable counter', () => {
    // hideProceduralFurniture = shell && gltf — with shell blocked, counter espresso stays.
    expect(isWalkableInteriorShellAllowed('cafe')).toBe(false);
    expect(isExteriorBuildingShell('cafe')).toBe(true);
  });

  it('classifies factory/pier/forest/corridor as backdrop dressing — not walkable envelopes', () => {
    for (const id of ['factory', 'pier', 'forestClearing', 'basement', 'corridor'] as const) {
      expect(isBackdropDressingShell(id), id).toBe(true);
      expect(isWalkableInteriorShellAllowed(id), id).toBe(false);
      expect(isExteriorBuildingShell(id), id).toBe(false);
      expect(INTERIOR_SHELL_MOUNT_KIND[id]).toBe('backdrop_dressing');
    }
  });

  it('corridor source bounds match the on-disk driveway slab (v4.14.0 re-measure)', () => {
    // corridor.glb = Kenney 'driveway-long' 0.36×0.01×0.40 — прежние [3,1.5,8]
    // были выдуманы и в 20 раз завышали масштаб оболочки.
    expect(INTERIOR_SHELL_SOURCE_BOUNDS_M.corridor[0]).toBeCloseTo(0.36, 2);
    expect(INTERIOR_SHELL_SOURCE_BOUNDS_M.corridor[1]).toBeCloseTo(0.01, 2);
    expect(INTERIOR_SHELL_SOURCE_BOUNDS_M.corridor[2]).toBeCloseTo(0.4, 2);
  });

  it('backdrop source bounds match on-disk GLBs (v4.14.0 re-measure)', () => {
    expect(INTERIOR_SHELL_SOURCE_BOUNDS_M.factory).toEqual([2.08, 1.47, 1.24]);
    expect(INTERIOR_SHELL_SOURCE_BOUNDS_M.basement).toEqual([0.85, 0.42, 0.52]);
    expect(INTERIOR_SHELL_SOURCE_BOUNDS_M.pier).toEqual([0.14, 0.01, 0.4]);
    expect(INTERIOR_SHELL_SOURCE_BOUNDS_M.forestClearing).toEqual([0.21, 0.77, 0.24]);
  });

  it('documents bedroom native AABB as the metre-scale apartment envelope', () => {
    expect(INTERIOR_SHELL_SOURCE_BOUNDS_M.volodkaBedroom[0]).toBeCloseTo(5, 3);
    expect(INTERIOR_SHELL_SOURCE_BOUNDS_M.volodkaBedroom[1]).toBeCloseTo(3, 3);
    expect(INTERIOR_SHELL_SOURCE_BOUNDS_M.volodkaBedroom[2]).toBeCloseTo(7.35, 2);
  });

  it('fits bedroom AABB to 5×3×7 with near-identity scale (no prop warping)', () => {
    const scale = getInteriorShellScale('volodkaBedroom', [5, 3, 7]);
    expect(scale[0]).toBeCloseTo(1, 5);
    expect(scale[1]).toBeCloseTo(1, 5);
    expect(scale[2]).toBeCloseTo(7 / 7.35, 3);
    expect(getInteriorShellScaleAnisotropy(scale)).toBeLessThan(1.1);
  });

  it('keeps corridor OFF the walkable-envelope path (driveway slab, not a corridor)', () => {
    // FIX v4.14.0: corridor.glb — плитка 0.4 м; SceneInteriorAssets-маунт удалён.
    expect(isWalkableInteriorShellAllowed('corridor')).toBe(false);
  });
});
