import { describe, expect, it } from 'vitest';
import { getSceneManifestAssets } from './sceneManifestAssets';

describe('sceneManifestAssets', () => {
  it('places eight shipped pine trees around CHK forest perimeter', () => {
    const pines = getSceneManifestAssets('chk_forest_zorge').filter((p) => p.assetId === 'veg_tree_pine');
    expect(pines).toHaveLength(8);
  });
});
