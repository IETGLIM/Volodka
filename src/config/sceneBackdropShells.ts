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

/** Hero outdoor / industrial backdrops mounted from scene visuals (not PhysicsSceneInner). */
export const SCENE_BACKDROP_SHELLS: Partial<Record<SceneId, SceneBackdropShellPlacement>> = {
  abandoned_factory: {
    url: INTERIOR_SHELL_MODELS.factory,
    position: [-2, 0, -8],
    scale: 0.8,
    rotationY: 0.35,
  },
  /** Basement GLB is backdrop_dressing — never replace the walkable procedural envelope. */
  factory_basement: {
    url: INTERIOR_SHELL_MODELS.basement,
    position: [0, 0.05, -7.5],
    scale: 1.35,
    rotationY: -Math.PI / 5,
  },
  underground_bunker: {
    url: INTERIOR_SHELL_MODELS.basement,
    position: [0, 0.05, -8.2],
    scale: 1.45,
    rotationY: Math.PI / 7,
  },
  river_pier: {
    url: INTERIOR_SHELL_MODELS.pier,
    position: [0, 0, -5.5],
    scale: 3.2,
    rotationY: Math.PI,
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
