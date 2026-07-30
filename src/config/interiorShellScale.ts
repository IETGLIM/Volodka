/**
 * Interior shell scale audit.
 *
 * Convention: 1 Three.js unit = 1 metre. The authored shell GLBs are tiny,
 * normalized layouts, so scene visuals fit their measured bounds to the
 * real room footprint instead of repeating magic divisors inline.
 */

export type InteriorShellModelId = 'volodkaBedroom' | 'cafe' | 'office' | 'library' | 'corridor';

export const INTERIOR_SHELL_SOURCE_BOUNDS_M: Record<InteriorShellModelId, readonly [number, number, number]> = {
  volodkaBedroom: [1.3, 0.83354, 1.02814],
  cafe: [0.8836, 0.8931, 1.09],
  office: [1.36, 2.88, 1.36],
  library: [0.9701, 1.293, 0.94],
  /** corridor.glb — calibrated to 6×16×3 m procedural shell at uniform scale 2.0 */
  corridor: [3.0, 1.5, 8.0],
};

export function getInteriorShellScale(
  shellId: InteriorShellModelId,
  targetBoundsM: readonly [number, number, number],
): [number, number, number] {
  const source = INTERIOR_SHELL_SOURCE_BOUNDS_M[shellId];
  return [
    targetBoundsM[0] / source[0],
    targetBoundsM[1] / source[1],
    targetBoundsM[2] / source[2],
  ];
}

/** Uniform scale for corridor/rooftop shells placed via SceneInteriorAssets. */
export function getInteriorShellUniformScale(
  shellId: InteriorShellModelId,
  targetBoundsM: readonly [number, number, number],
): number {
  const source = INTERIOR_SHELL_SOURCE_BOUNDS_M[shellId];
  const scaleX = targetBoundsM[0] / source[0];
  const scaleZ = targetBoundsM[2] / source[2];
  return Math.max(scaleX, scaleZ);
}
