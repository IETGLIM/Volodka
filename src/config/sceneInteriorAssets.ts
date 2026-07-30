/* ─── Volodka RPG – CC0 interior GLB shells per scene ─── */

import type { SceneId } from '@/shared/types/game';

export interface SceneInteriorPlacement {
  assetId: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  /** Uniform scale — GLBs are metre-normalized; values ≈1 place backdrop shells. */
  scale?: number;
}

/** Kenney building shells (Poly Pizza TODO) — backdrop dressing via GltfAsset manifest. */
export const SCENE_INTERIOR_ASSETS: Partial<Record<SceneId, readonly SceneInteriorPlacement[]>> = {
  // volodka_room: removed — VolodkaRoomVisual provides full procedural geometry;
  // the interior_room_bedroom GLB shell was overlapping with procedural walls/floor/ceiling.
  volodka_corridor: [
    { assetId: 'interior_corridor', position: [0, 0, 4], scale: 2.0, rotation: [0, Math.PI / 2, 0] },
  ],
  // cafe_evening, office_day, and library_day are owned by their scene visuals'
  // AuthoredInteriorShell mounts. Keep them out of the generic Physics subtree
  // to avoid duplicate offset shell rendering.
  abandoned_factory: [
    { assetId: 'interior_factory', position: [-2, 0, -8], scale: 0.8, rotation: [0, 0.35, 0] },
  ],
  factory_basement: [
    { assetId: 'interior_basement', position: [-1, 0.2, -3], scale: 2.5, rotation: [0, -Math.PI / 4, 0] },
  ],
  rooftop_edge: [
    { assetId: 'interior_rooftop', position: [4, 0, -6], scale: 1.8, rotation: [0, Math.PI / 3, 0] },
  ],
  river_pier: [
    { assetId: 'interior_pier', position: [0, 0, -4], scale: 3.0, rotation: [0, Math.PI, 0] },
  ],
  chk_forest_zorge: [
    { assetId: 'interior_forest_clearing', position: [-6, 0, -8], scale: 4.0, rotation: [0, 0.2, 0] },
  ],
};

export function getSceneInteriorAssets(sceneId: SceneId): readonly SceneInteriorPlacement[] {
  return SCENE_INTERIOR_ASSETS[sceneId] ?? [];
}

export function getSceneInteriorAssetIds(sceneId: SceneId): string[] {
  const ids = new Set<string>();
  for (const placement of getSceneInteriorAssets(sceneId)) {
    ids.add(placement.assetId);
  }
  return [...ids];
}
