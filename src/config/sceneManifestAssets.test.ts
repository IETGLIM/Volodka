import { describe, expect, it } from 'vitest';
import { getSceneManifestAssets } from './sceneManifestAssets';

/* v4.14.0: veg_tree_pine (Khronos «Avocado» 4×6×3 см) снят с маунтов;
 * деревья переехали в SCENE_PROP_DRESSING как kenney_forest_tree (4.3 м). */

describe('sceneManifestAssets', () => {
  it('no longer mounts avocado-placeholder pines anywhere', () => {
    for (const sceneId of ['chk_forest_zorge', 'park_day'] as const) {
      const pines = getSceneManifestAssets(sceneId).filter((p) => p.assetId === 'veg_tree_pine');
      expect(pines, sceneId).toHaveLength(0);
    }
  });

  it('keeps the cafe props pile grounded (groundAnchor — minY −0.247 проседал на 0.37 м)', () => {
    const pile = getSceneManifestAssets('cafe_evening').find((p) => p.assetId === 'env_cafe_props');
    expect(pile).toBeTruthy();
    expect(pile!.groundAnchor).toBe(true);
  });
});
