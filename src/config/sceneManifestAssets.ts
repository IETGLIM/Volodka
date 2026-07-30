/* ─── Volodka RPG – manifest GLB bundles placed per scene ─── */

import type { SceneId } from '@/shared/types/game';

export interface SceneManifestPlacement {
  assetId: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}

/** GltfAsset manifest entries rendered as scene dressing (LOD handled by GltfAsset). */
export const SCENE_MANIFEST_ASSETS: Partial<Record<SceneId, readonly SceneManifestPlacement[]>> = {
  cafe_evening: [
    { assetId: 'env_cafe_props', position: [2.5, 0, -3.5], scale: 1.5, rotation: [0, Math.PI / 4, 0] },
  ],
  park_day: [
    { assetId: 'veg_tree_pine', position: [-8, 0, -8], scale: 2.0 },
    { assetId: 'veg_tree_pine', position: [9, 0, -6], scale: 1.8, rotation: [0, 0.6, 0] },
    { assetId: 'veg_tree_pine', position: [-10, 0, 5], scale: 2.2, rotation: [0, -0.4, 0] },
  ],
  chk_forest_zorge: [
    { assetId: 'veg_tree_pine', position: [-12, 0, -10], scale: 2.4, rotation: [0, 0.35, 0] },
    { assetId: 'veg_tree_pine', position: [11, 0, -9], scale: 2.1, rotation: [0, -0.5, 0] },
    { assetId: 'veg_tree_pine', position: [-13, 0, 5], scale: 2.0, rotation: [0, 0.8, 0] },
    { assetId: 'veg_tree_pine', position: [10, 0, 8], scale: 1.9, rotation: [0, -0.25, 0] },
    { assetId: 'veg_tree_pine', position: [-14, 0, -2], scale: 2.15, rotation: [0, 0.15, 0] },
    { assetId: 'veg_tree_pine', position: [13, 0, 1], scale: 2.05, rotation: [0, -0.7, 0] },
    { assetId: 'veg_tree_pine', position: [-9, 0, 11], scale: 1.85, rotation: [0, 0.55, 0] },
    { assetId: 'veg_tree_pine', position: [8, 0, -13], scale: 2.25, rotation: [0, -0.35, 0] },
  ],
};

export function getSceneManifestAssets(sceneId: SceneId): readonly SceneManifestPlacement[] {
  return SCENE_MANIFEST_ASSETS[sceneId] ?? [];
}
