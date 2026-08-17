import { describe, expect, it } from 'vitest';
import { getSceneBackdropShell, SCENE_BACKDROP_SHELLS } from './sceneBackdropShells';
import { getSceneInteriorAssets } from './sceneInteriorAssets';
import { isSceneAssetSystemAllowed } from './assetOwnership';
import { isBackdropDressingShell } from './interiorShellScale';

describe('sceneBackdropShells', () => {
  it('declares hero outdoor/industrial backdrops without generic interior asset duplication', () => {
    for (const sceneId of [
      'abandoned_factory',
      'factory_basement',
      'underground_bunker',
      'river_pier',
      'chk_forest_zorge',
    ] as const) {
      expect(SCENE_BACKDROP_SHELLS[sceneId], sceneId).toBeTruthy();
      expect(getSceneInteriorAssets(sceneId), sceneId).toEqual([]);
      expect(isSceneAssetSystemAllowed(sceneId, 'interior_shell', 'AuthoredInteriorShell')).toBe(true);
      expect(isSceneAssetSystemAllowed(sceneId, 'interior_shell', 'SceneInteriorAssets')).toBe(false);
    }
  });

  it('resolves backdrop urls from interior shell models', () => {
    expect(getSceneBackdropShell('river_pier')?.url).toContain('/models/interiors/pier.glb');
    expect(getSceneBackdropShell('abandoned_factory')?.scale).toBe(0.8);
    expect(getSceneBackdropShell('factory_basement')?.url).toContain('/models/interiors/basement.glb');
    expect(getSceneBackdropShell('underground_bunker')?.url).toContain('/models/interiors/basement.glb');
  });

  it('does not duplicate factory_basement shell via generic interior assets', () => {
    expect(getSceneInteriorAssets('factory_basement')).toEqual([]);
  });

  it('keeps abandoned_factory GLB as far-yard backdrop_dressing (not a walkable clutter replace)', () => {
    expect(isBackdropDressingShell('factory')).toBe(true);
    const shell = getSceneBackdropShell('abandoned_factory');
    expect(shell).toBeTruthy();
    // Far negative Z — industrial impostor behind the procedural yard, not floor owner.
    expect(shell!.position[2]).toBeLessThanOrEqual(-6);
    expect(shell!.scale === 0.8 || (Array.isArray(shell!.scale) && shell!.scale[0] <= 1)).toBe(true);
  });

  it('keeps river_pier GLB as far-water backdrop_dressing (not a dock clutter replace)', () => {
    expect(isBackdropDressingShell('pier')).toBe(true);
    const shell = getSceneBackdropShell('river_pier');
    expect(shell).toBeTruthy();
    // Negative Z over water — pier impostor behind/below the walkable deck edge.
    expect(shell!.position[2]).toBeLessThanOrEqual(-5);
  });

  it('keeps chk_forest_zorge GLB as far-perimeter backdrop_dressing (not a tree-belt replace)', () => {
    expect(isBackdropDressingShell('forestClearing')).toBe(true);
    const shell = getSceneBackdropShell('chk_forest_zorge');
    expect(shell).toBeTruthy();
    // Offset far from campfire origin — clearing impostor, not density owner.
    expect(shell!.position[2]).toBeLessThanOrEqual(-6);
  });
});
