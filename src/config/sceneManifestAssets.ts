/* ─── Volodka RPG – manifest GLB bundles placed per scene ─── */

import type { SceneId } from '@/shared/types/game';

export interface SceneManifestPlacement {
  assetId: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  /**
   * FIX v4.14.0: поднять модель так, чтобы её низ стоял на placement.y.
   * env_cafe_props имеет minY −0.247 — без якоря куча проседала на 0.37 м под пол.
   */
  groundAnchor?: boolean;
}

/** GltfAsset manifest entries rendered as scene dressing (LOD handled by GltfAsset). */
export const SCENE_MANIFEST_ASSETS: Partial<Record<SceneId, readonly SceneManifestPlacement[]>> = {
  cafe_evening: [
    { assetId: 'env_cafe_props', position: [2.5, 0, -3.5], scale: 1.5, rotation: [0, Math.PI / 4, 0], groundAnchor: true },
  ],
  // FIX v4.14.0: манифест-деревья veg_tree_pine удалены из park_day и
  // chk_forest_zorge — на диске это заглушка Khronos «Avocado» 4×6×3 см
  // (lods-комментарий в assetManifest подтверждает фейковую LOD-цепочку).
  // Деревья переехали в SCENE_PROP_DRESSING (kenney_forest_tree, 4.3 м).
};

export function getSceneManifestAssets(sceneId: SceneId): readonly SceneManifestPlacement[] {
  return SCENE_MANIFEST_ASSETS[sceneId] ?? [];
}
