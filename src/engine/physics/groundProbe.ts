import type { RapierCollider, RapierRigidBody } from '@react-three/rapier';
import { MAX_SLOPE_CLIMB } from '@/engine/player/playerConstants';

/** Minimum upward normal Y for a surface to count as walkable ground.
 *  Aligned with KCC's MAX_SLOPE_CLIMB (π/4 = 45°): cos(45°) ≈ 0.707. */
const MIN_GROUND_NORMAL_Y = Math.cos(MAX_SLOPE_CLIMB);
/** Max downward ray length — enough for multi-level interiors. */
const GROUND_PROBE_MAX_DISTANCE = 10;
/** Ray starts this far above the query Y to avoid origin-inside-floor edge cases. */
const GROUND_PROBE_ORIGIN_LIFT = 0.1;
const DOWN = { x: 0, y: -1, z: 0 } as const;

/** Collision group bitmask: only static environment (group 1). */
const ENVIRONMENT_COLLISION_GROUP = 0b0000_0000_0000_0001;

/** Minimal Rapier world surface for downward ground raycasts. */
export type GroundProbeWorld = {
  castRayAndGetNormal(
    ray: unknown,
    maxToi: number,
    solid: boolean,
    filterFlags?: unknown,
    filterGroups?: unknown,
    filterExcludeCollider?: unknown,
    filterExcludeRigidBody?: unknown,
  ): { timeOfImpact: number; normal: { x: number; y: number; z: number } } | null;
};

/** Minimal Rapier module surface for constructing probe rays. */
export type GroundProbeRapier = {
  Ray: new (
    origin: { x: number; y: number; z: number },
    dir: { x: number; y: number; z: number },
  ) => unknown;
};

/**
 * Raycast downward from the player's feet to find walkable ground Y.
 * Falls back to `fallbackFloorY` when no valid hit (single-floor scenes, void).
 */
export function probeGroundY(
  world: GroundProbeWorld,
  rapier: GroundProbeRapier,
  x: number,
  feetY: number,
  z: number,
  fallbackFloorY: number,
  excludeCollider?: RapierCollider | null,
  excludeRigidBody?: RapierRigidBody | null,
): number {
  const originY = feetY + GROUND_PROBE_ORIGIN_LIFT;
  const ray = new rapier.Ray({ x, y: originY, z }, DOWN);
  const hit = world.castRayAndGetNormal(
    ray,
    GROUND_PROBE_MAX_DISTANCE,
    true,
    undefined,
    ENVIRONMENT_COLLISION_GROUP,
    excludeCollider ?? undefined,
    excludeRigidBody ?? undefined,
  );
  if (!hit) return fallbackFloorY;
  if (hit.normal.y < MIN_GROUND_NORMAL_Y) return fallbackFloorY;

  const hitY = originY - hit.timeOfImpact;
  // Reject hits above feet (ceilings / overhangs picked before floor).
  // PHYS-2: Use originY instead of feetY + 0.12 to avoid rejecting valid
  // close-to-floor hits on stairs and uneven terrain. Any hit at or above
  // the ray origin didn't actually go downward meaningfully.
  if (hitY > originY) return fallbackFloorY;

  return hitY;
}
