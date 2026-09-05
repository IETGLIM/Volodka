import { describe, expect, it } from 'vitest';
import { getSceneBackdropShell, SCENE_BACKDROP_SHELLS } from './sceneBackdropShells';
import { getSceneInteriorAssets } from './sceneInteriorAssets';
import { isSceneAssetSystemAllowed } from './assetOwnership';
import { isBackdropDressingShell } from './interiorShellScale';

/* v4.14.0: политики переписаны по фактическим on-disk габаритам GLB.
 * pier.glb — 'path-stones-long' (плитка 0.14×0.01×0.40) — не пирс, маунт удалён;
 * масштабы factory/basement пересчитаны под реальные размеры (см. конфиг). */

describe('sceneBackdropShells', () => {
  it('declares hero outdoor/industrial backdrops without generic interior asset duplication', () => {
    for (const sceneId of [
      'abandoned_factory',
      'factory_basement',
      'underground_bunker',
      'chk_forest_zorge',
    ] as const) {
      expect(SCENE_BACKDROP_SHELLS[sceneId], sceneId).toBeTruthy();
      expect(getSceneInteriorAssets(sceneId), sceneId).toEqual([]);
      expect(isSceneAssetSystemAllowed(sceneId, 'interior_shell', 'AuthoredInteriorShell')).toBe(true);
      expect(isSceneAssetSystemAllowed(sceneId, 'interior_shell', 'SceneInteriorAssets')).toBe(false);
    }
  });

  it('does NOT mount river_pier backdrop — pier.glb is a 0.4 m path-stone, not a pier', () => {
    // FIX v4.14.0: плитка-дорожка при любом масштабе читается как коврик на палубе.
    expect(SCENE_BACKDROP_SHELLS.river_pier).toBeUndefined();
    expect(getSceneBackdropShell('river_pier')).toBeUndefined();
  });

  it('resolves backdrop urls from interior shell models', () => {
    expect(getSceneBackdropShell('abandoned_factory')?.url).toContain('/models/interiors/factory.glb');
    expect(getSceneBackdropShell('factory_basement')?.url).toContain('/models/interiors/basement.glb');
    expect(getSceneBackdropShell('underground_bunker')?.url).toContain('/models/interiors/basement.glb');
    expect(getSceneBackdropShell('chk_forest_zorge')?.url).toContain('/models/interiors/forest_clearing.glb');
  });

  it('scales factory building to ~3 m корпус (native 2.08×1.47×1.24)', () => {
    // Прежние 0.8 давали «хижину» 1.66 м; 1.5 → 3.1×2.2×1.9 м силуэт корпуса.
    expect(getSceneBackdropShell('abandoned_factory')?.scale).toBe(1.5);
  });

  it('scales basement tanks to readable 2.2–2.6 м (native detail-tank 0.85×0.42×0.52)', () => {
    expect(getSceneBackdropShell('factory_basement')?.scale).toBe(2.6);
    expect(getSceneBackdropShell('underground_bunker')?.scale).toBe(3.0);
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
  });

  it('keeps chk_forest_zorge GLB as far-perimeter backdrop_dressing (not a tree-belt replace)', () => {
    expect(isBackdropDressingShell('forestClearing')).toBe(true);
    const shell = getSceneBackdropShell('chk_forest_zorge');
    expect(shell).toBeTruthy();
    // Offset far from campfire origin — clearing impostor, not density owner.
    expect(shell!.position[2]).toBeLessThanOrEqual(-6);
  });
});
