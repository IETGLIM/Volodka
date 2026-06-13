import type { RapierCollider, RapierRigidBody } from '@react-three/rapier';

/** Minimum upward normal Y for a surface to count as walkable ground. */
const MIN_GROUND_NORMAL_Y = 0.35;
/** Max downward ray length — enough for multi-level interiors. */
const GROUND_PROBE_MAX_DISTANCE = 10;
/** Ray starts this far above the query Y to avoid origin-inside-floor edge cases. */
const GROUND_PROBE_ORIGIN_LIFT = 0.1;
const DOWN = { x: 0, y: -1, z: 0 } as const;

type GroundProbeWorld = {
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

type GroundProbeRapier = {
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
    undefined,
    excludeCollider ?? undefined,
    excludeRigidBody ?? undefined,
  );
  if (!hit) return fallbackFloorY;
  if (hit.normal.y < MIN_GROUND_NORMAL_Y) return fallbackFloorY;

  const hitY = originY - hit.timeOfImpact;
  // Reject hits above feet (ceilings / overhangs picked before floor).
  if (hitY > feetY + 0.12) return fallbackFloorY;

  return hitY;
}
