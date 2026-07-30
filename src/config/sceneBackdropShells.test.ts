import { describe, expect, it } from 'vitest';
import { getSceneBackdropShell, SCENE_BACKDROP_SHELLS } from './sceneBackdropShells';
import { getSceneInteriorAssets } from './sceneInteriorAssets';
import { isSceneAssetSystemAllowed } from './assetOwnership';

describe('sceneBackdropShells', () => {
  it('declares hero outdoor backdrops without generic interior asset duplication', () => {
    for (const sceneId of ['abandoned_factory', 'river_pier', 'chk_forest_zorge'] as const) {
      expect(SCENE_BACKDROP_SHELLS[sceneId], sceneId).toBeTruthy();
      expect(getSceneInteriorAssets(sceneId), sceneId).toEqual([]);
      expect(isSceneAssetSystemAllowed(sceneId, 'interior_shell', 'AuthoredInteriorShell')).toBe(true);
      expect(isSceneAssetSystemAllowed(sceneId, 'interior_shell', 'SceneInteriorAssets')).toBe(false);
    }
  });

  it('resolves backdrop urls from interior shell models', () => {
    expect(getSceneBackdropShell('river_pier')?.url).toContain('/models/interiors/pier.glb');
    expect(getSceneBackdropShell('abandoned_factory')?.scale).toBe(0.8);
  });
});
