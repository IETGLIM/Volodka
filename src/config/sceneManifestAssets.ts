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
    { assetId: 'env_cafe_props', position: [2.5, 0, -3.5], scale: 0.15, rotation: [0, Math.PI / 4, 0] },
  ],
  park_day: [
    { assetId: 'veg_tree_pine', position: [-8, 0, -8], scale: 0.02 },
    { assetId: 'veg_tree_pine', position: [9, 0, -6], scale: 0.018, rotation: [0, 0.6, 0] },
    { assetId: 'veg_tree_pine', position: [-10, 0, 5], scale: 0.022, rotation: [0, -0.4, 0] },
  ],
};

export function getSceneManifestAssets(sceneId: SceneId): readonly SceneManifestPlacement[] {
  return SCENE_MANIFEST_ASSETS[sceneId] ?? [];
}
