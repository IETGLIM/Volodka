/**
 * Interior shell scale audit.
 *
 * Convention: 1 Three.js unit = 1 metre. The authored shell GLBs are tiny,
 * normalized layouts, so scene visuals fit their measured bounds to the
 * real room footprint instead of repeating magic divisors inline.
 *
 * CRITICAL: Several shipped "interior" GLBs are Kenney *exterior* buildings
 * (building-type-a / building-c / skyscraper / building-b). Stretching those
 * AABB envelopes to a walkable room places facade posts (~2 m) in the desk
 * volume — monitors disappear, the player reads as outside the visual room,
 * and chimney/antenna posts look like a tripod camera filling the space.
 *
 * Backdrop shells (factory / pier / forest clearing) are outdoor dressing only.
 * Never mount them as walkable envelopes that replace procedural floor/walls.
 */

export type InteriorShellModelId =
  | 'volodkaBedroom'
  | 'cafe'
  | 'office'
  | 'library'
  | 'corridor'
  | 'factory'
  | 'basement'
  | 'pier'
  | 'forestClearing';

/** Measured world AABB of each shell GLB after GLTF node transforms (metres). */
export const INTERIOR_SHELL_SOURCE_BOUNDS_M: Record<
  InteriorShellModelId,
  readonly [number, number, number]
> = {
  /** Metre-scale authored apartment envelope (scripts/generate-volodka-apartment-envelope.mjs). */
  volodkaBedroom: [5, 3, 7.35],
  cafe: [0.8836, 0.8931, 1.09],
  office: [1.36, 2.88, 1.36],
  library: [0.9701, 1.293, 0.94],
  /** corridor.glb — calibrated to 6×16×3 m procedural shell at uniform scale 2.0 */
  corridor: [3.0, 1.5, 8.0],
  /** Approximate native bounds — backdrop shells use uniform SceneBackdropShell scale. */
  factory: [2.0, 1.5, 2.0],
  basement: [2.0, 1.2, 2.0],
  pier: [1.5, 0.6, 3.0],
  forestClearing: [2.0, 1.0, 2.0],
};

/**
 * Walkable-room mount policy.
 * `exterior_building` shells must NOT replace procedural floor/walls/ceiling.
 * `backdrop_dressing` shells are outdoor/industrial impostors for SceneBackdropShell only.
 */
export type InteriorShellMountKind =
  | 'walkable_envelope'
  | 'exterior_building'
  | 'backdrop_dressing';

export const INTERIOR_SHELL_MOUNT_KIND: Record<InteriorShellModelId, InteriorShellMountKind> = {
  // Authored metre-scale apartment envelope (not Kenney exterior).
  volodkaBedroom: 'walkable_envelope',
  // Kenney building-c — exterior impostor.
  cafe: 'exterior_building',
  // Kenney building-skyscraper-a — exterior impostor.
  office: 'exterior_building',
  // Kenney building-b — exterior impostor.
  library: 'exterior_building',
  // Corridor uses a long driveway slab as a deferred fallback backdrop only.
  corridor: 'walkable_envelope',
  // Outdoor / industrial dressing via SceneBackdropShell — not walkable rooms.
  factory: 'backdrop_dressing',
  basement: 'backdrop_dressing',
  pier: 'backdrop_dressing',
  forestClearing: 'backdrop_dressing',
};

/** True when the shell may replace procedural walls of a walkable interior. */
export function isWalkableInteriorShellAllowed(shellId: InteriorShellModelId): boolean {
  return INTERIOR_SHELL_MOUNT_KIND[shellId] === 'walkable_envelope';
}

/** Kenney facade impostors — blocked from AuthoredInteriorShell walkable mounts. */
export function isExteriorBuildingShell(shellId: InteriorShellModelId): boolean {
  return INTERIOR_SHELL_MOUNT_KIND[shellId] === 'exterior_building';
}

/** Factory / pier / forest — backdrop-only; must not own procedural interiors. */
export function isBackdropDressingShell(shellId: InteriorShellModelId): boolean {
  return INTERIOR_SHELL_MOUNT_KIND[shellId] === 'backdrop_dressing';
}

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

/** Max/min axis ratio of a non-uniform shell fit — >~1.5 warps furniture proportions. */
export function getInteriorShellScaleAnisotropy(
  scale: readonly [number, number, number],
): number {
  const min = Math.min(scale[0], scale[1], scale[2]);
  const max = Math.max(scale[0], scale[1], scale[2]);
  if (!(min > 1e-6)) return Number.POSITIVE_INFINITY;
  return max / min;
}
