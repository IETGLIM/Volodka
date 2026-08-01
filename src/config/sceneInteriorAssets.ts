/* ─── Volodka RPG – CC0 interior GLB shells per scene ─── */

import type { SceneId } from '@/shared/types/game';
import { isSceneAssetSystemAllowed } from '@/config/assetOwnership';
import { getInteriorShellUniformScale } from '@/config/interiorShellScale';

const CORRIDOR_TARGET_BOUNDS_M: [number, number, number] = [6, 3, 16];
const CORRIDOR_SHELL_UNIFORM_SCALE = getInteriorShellUniformScale('corridor', CORRIDOR_TARGET_BOUNDS_M);

export interface SceneInteriorPlacement {
  assetId: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  /** Uniform scale — GLBs are metre-normalized; values ≈1 place backdrop shells. */
  scale?: number;
}

/** Kenney building shells (Poly Pizza TODO) — backdrop dressing via GltfAsset manifest. */
export const SCENE_INTERIOR_ASSETS: Partial<Record<SceneId, readonly SceneInteriorPlacement[]>> = {
  // volodka_room: AuthoredInteriorShell mounts apartment_envelope.glb (metre-scale walkable).
  volodka_corridor: [
    {
      assetId: 'interior_corridor',
      position: [0, 0, 4],
      scale: CORRIDOR_SHELL_UNIFORM_SCALE,
      rotation: [0, Math.PI / 2, 0],
    },
  ],
  // cafe_evening, office_day, library_day, albert_backroom, guild_mainframe,
  // library_basement use procedural envelopes (Kenney exteriors blocked).
  // abandoned_factory / factory_basement / underground_bunker / river_pier /
  // chk_forest_zorge backdrop shells are owned via SceneBackdropShell.
  rooftop_edge: [
    { assetId: 'interior_rooftop', position: [4, 0, -6], scale: 1.8, rotation: [0, Math.PI / 3, 0] },
  ],
};

export function getSceneInteriorAssets(sceneId: SceneId): readonly SceneInteriorPlacement[] {
  const placements = SCENE_INTERIOR_ASSETS[sceneId] ?? [];
  if (!isSceneAssetSystemAllowed(sceneId, 'interior_shell', 'SceneInteriorAssets')) {
    return [];
  }
  return placements;
}

export function getSceneInteriorAssetIds(sceneId: SceneId): string[] {
  const ids = new Set<string>();
  for (const placement of getSceneInteriorAssets(sceneId)) {
    ids.add(placement.assetId);
  }
  return [...ids];
}
