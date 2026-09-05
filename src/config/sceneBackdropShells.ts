/* ─── Volodka RPG – Kenney/CC0 backdrop shells owned by scene visuals ─── */

import type { SceneId } from '@/shared/types/game';
import { INTERIOR_SHELL_MODELS } from '@/config/interiorShellModels';
import { isSceneAssetSystemAllowed } from '@/config/assetOwnership';

export interface SceneBackdropShellPlacement {
  url: string;
  position: [number, number, number];
  rotationY?: number;
  scale?: number | [number, number, number];
}

/**
 * Hero outdoor / industrial backdrops mounted from scene visuals (not PhysicsSceneInner).
 *
 * FIX v4.14.0: масштабы пересчитаны по реальным on-disk габаритам GLB
 * (замер: scripts/tsc-независимый GLB-парсер, см. INTERIOR_SHELL_SOURCE_BOUNDS_M):
 * - factory.glb ('building-a') 2.08×1.47×1.24 → scale 1.5 = 3.1×2.2×1.9 м корпус;
 *   прежние 0.8 давали «хижину» 1.66 м.
 * - basement.glb ('detail-tank') 0.85×0.42×0.52 → масштабы 2.6/3.0 = бак
 *   2.2–2.6 м; прежние 1.35/1.45 — кадка 1.15 м.
 * - river_pier удалён: pier.glb — 'path-stones-long' 0.14×0.01×0.40 (плитка-дорожка,
 *   НЕ пирс); при любом масштабе читается как коврик — визуал пира процедурный.
 */
export const SCENE_BACKDROP_SHELLS: Partial<Record<SceneId, SceneBackdropShellPlacement>> = {
  abandoned_factory: {
    url: INTERIOR_SHELL_MODELS.factory,
    position: [-2, 0, -8],
    scale: 1.5,
    rotationY: 0.35,
  },
  /** Basement GLB is backdrop_dressing — never replace the walkable procedural envelope. */
  factory_basement: {
    url: INTERIOR_SHELL_MODELS.basement,
    position: [0, 0.05, -7.5],
    scale: 2.6,
    rotationY: -Math.PI / 5,
  },
  underground_bunker: {
    url: INTERIOR_SHELL_MODELS.basement,
    position: [0, 0.05, -8.2],
    scale: 3.0,
    rotationY: Math.PI / 7,
  },
  chk_forest_zorge: {
    url: INTERIOR_SHELL_MODELS.forestClearing,
    position: [-6, 0, -8],
    scale: 4.0,
    rotationY: 0.2,
  },
};

export function getSceneBackdropShell(sceneId: SceneId): SceneBackdropShellPlacement | undefined {
  const placement = SCENE_BACKDROP_SHELLS[sceneId];
  if (!placement) return undefined;
  if (!isSceneAssetSystemAllowed(sceneId, 'interior_shell', 'AuthoredInteriorShell')) {
    return undefined;
  }
  return placement;
}
