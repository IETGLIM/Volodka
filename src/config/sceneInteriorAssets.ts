/* ─── Volodka RPG – CC0 interior GLB shells per scene ─── */

import type { SceneId } from '@/shared/types/game';
import { isSceneAssetSystemAllowed } from '@/config/assetOwnership';

export interface SceneInteriorPlacement {
  assetId: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  /** Uniform scale — GLBs are metre-normalized; values ≈1 place backdrop shells. */
  scale?: number;
}

/**
 * Kenney building shells — backdrop dressing via GltfAsset manifest.
 *
 * FIX v4.14.0: маунты volodka_corridor и rooftop_edge удалены:
 * - interior_corridor (corridor.glb) — 'driveway-long', плитка-дорожка
 *   0.36×0.01×0.40 м; при uniform scale 2.0 рендерил «коврик» 0.72×0.02×0.80
 *   в коридоре с полностью процедурной геометрией.
 * - interior_rooftop (rooftop.glb) — 'low-detail-building-a' 0.5×2×0.5 при
 *   scale 1.8 стоял на [4,0,−6] — вне плиты крыши (±2.5, ±4), парил в пустоте;
 *   у RooftopEdgeVisual есть собственная процедурная линия горизонта.
 * cafe_evening / office_day / library_day / albert_backroom / guild_mainframe /
 * library_basement используют процедурные оболочки (Kenney exteriors blocked).
 * abandoned_factory / factory_basement / underground_bunker / river_pier /
 * chk_forest_zorge — фоновые оболочки через SceneBackdropShell.
 */
export const SCENE_INTERIOR_ASSETS: Partial<Record<SceneId, readonly SceneInteriorPlacement[]>> = {
  // volodka_room: AuthoredInteriorShell mounts apartment_envelope.glb (metre-scale walkable).
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
