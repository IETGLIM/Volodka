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
  it('blocks Kenney exterior building impostors from walkable room mounts', () => {
    expect(isWalkableInteriorShellAllowed('volodkaBedroom')).toBe(false);
    expect(isWalkableInteriorShellAllowed('cafe')).toBe(false);
    expect(isWalkableInteriorShellAllowed('office')).toBe(false);
    expect(isWalkableInteriorShellAllowed('library')).toBe(false);
    expect(INTERIOR_SHELL_MOUNT_KIND.volodkaBedroom).toBe('exterior_building');
    expect(isExteriorBuildingShell('cafe')).toBe(true);
    expect(isExteriorBuildingShell('office')).toBe(true);
  });

  it('cafe shell stays blocked so High prop dressing cannot own the walkable counter', () => {
    // hideProceduralFurniture = shell && gltf — with shell blocked, counter espresso stays.
    expect(isWalkableInteriorShellAllowed('cafe')).toBe(false);
    expect(isExteriorBuildingShell('cafe')).toBe(true);
  });

  it('classifies factory/pier/forest as backdrop dressing — not walkable envelopes', () => {
    for (const id of ['factory', 'pier', 'forestClearing', 'basement'] as const) {
      expect(isBackdropDressingShell(id), id).toBe(true);
      expect(isWalkableInteriorShellAllowed(id), id).toBe(false);
      expect(isExteriorBuildingShell(id), id).toBe(false);
      expect(INTERIOR_SHELL_MOUNT_KIND[id]).toBe('backdrop_dressing');
    }
  });

  it('documents bedroom native AABB used by the (blocked) shell fit', () => {
    expect(INTERIOR_SHELL_SOURCE_BOUNDS_M.volodkaBedroom[0]).toBeCloseTo(1.3, 3);
    expect(INTERIOR_SHELL_SOURCE_BOUNDS_M.volodkaBedroom[1]).toBeCloseTo(0.83354, 4);
    expect(INTERIOR_SHELL_SOURCE_BOUNDS_M.volodkaBedroom[2]).toBeCloseTo(1.02814, 4);
  });

  it('shows bedroom AABB fit to 5×3×7 is highly anisotropic (why it warps props)', () => {
    const scale = getInteriorShellScale('volodkaBedroom', [5, 3, 7]);
    expect(scale[0]).toBeCloseTo(5 / 1.3, 5);
    expect(scale[1]).toBeCloseTo(3 / 0.83354, 5);
    expect(scale[2]).toBeCloseTo(7 / 1.02814, 5);
    // Before fix this non-uniform ~3.85×3.60×6.81 stretch put ~2.15 m facade posts at the desk.
    expect(getInteriorShellScaleAnisotropy(scale)).toBeGreaterThan(1.5);
    expect(scale[0]).toBeGreaterThan(3.5);
    expect(scale[0]).toBeLessThan(4.0);
    expect(scale[2]).toBeGreaterThan(6.5);
    expect(scale[2]).toBeLessThan(7.0);
  });

  it('keeps corridor policy as walkable envelope (SceneInteriorAssets path)', () => {
    expect(isWalkableInteriorShellAllowed('corridor')).toBe(true);
  });
});
