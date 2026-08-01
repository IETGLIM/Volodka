import type { NPCAppearance, NPCSilhouette } from '@/shared/types/definitions/npc';

export type SilhouetteScale = readonly [number, number, number];

const SILHOUETTE_XZ: Record<NPCSilhouette, { x: number; z: number }> = {
  slim: { x: 0.86, z: 0.9 },
  average: { x: 1, z: 1 },
  heavy: { x: 1.14, z: 1.1 },
};

/**
 * Non-uniform body scale so shared Quaternius GLBs don't read as twin clones.
 * Y carries appearance.height; XZ carries silhouette mass.
 */
export function resolveNpcSilhouetteScale(appearance: NPCAppearance): SilhouetteScale {
  const xz = SILHOUETTE_XZ[appearance.silhouette] ?? SILHOUETTE_XZ.average;
  const y = Math.max(0.9, Math.min(1.14, appearance.height || 1));
  return [xz.x, y, xz.z] as const;
}

/** Uniform fit scale × silhouette axes — safe for R3F group scale prop. */
export function composeNpcFitScale(
  fitUniformScale: number,
  appearance: NPCAppearance,
): [number, number, number] {
  const [sx, sy, sz] = resolveNpcSilhouetteScale(appearance);
  return [fitUniformScale * sx, fitUniformScale * sy, fitUniformScale * sz];
}
