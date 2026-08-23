/* ─── Volodka RPG – creep tactical AI (3D layer) ───
 * Pure helpers for PatrollingCreeps.tsx (Task 3.3-b2):
 *   - Line-of-sight gating for the stealth vision cone (segment-vs-AABB,
 *     slab method) so creeps no longer see the player through walls.
 *   - WoW-style leash ranges (chase origin → player distance cap) wired to
 *     the per-type config from engine/combat/enemyAiBehaviors.ts.
 *   - Ranged kiting (hold a preferred distance band, retreat when crowded).
 *   - Stuck detection for wall-blocked chases (no teleports — give up).
 *   - Nav-mesh path helpers for wall-aware pursuit and the walk home.
 *
 * Intentionally pure (no Three.js / React / Rapier) so it can be unit-tested
 * in isolation — mirrors the npcObstacleAvoidance.ts conventions. */

import type { ColliderDef } from '@/shared/types/sceneDefinition';
import type { EnemyAiConfig } from '@/engine/combat/enemyAiBehaviors';
import { obstacleToAabb, type NpcObstacleAabb } from './npcObstacleAvoidance';
import { findNavMeshPath } from './navMeshPathfinder';
import { getNavMeshForScene } from './navMeshCache';
import type { NavMeshGraph } from './navMeshBuilder';

/* ═══════════════════════════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════════════════════════ */

/** Full height (m) a collider must reach to block creep sight lines.
 *  Walls, bookshelves and wardrobes block vision; desks, beds and
 *  armchairs (≈0.6–0.8 m) do not. `ColliderDef.size` holds HALF-extents. */
export const VISION_BLOCKER_MIN_HEIGHT = 1.2;

/** Line-of-sight re-check interval (s) per creep — ~5 Hz, the result is
 *  cached between checks (per-frame precision is not needed for stealth). */
export const CREEP_LOS_CHECK_INTERVAL_S = 0.2;

/** Seconds the player must stay out of contact range before a chasing
 *  creep gives up and returns to its patrol (WoW-style evade). */
export const CREEP_CONTACT_LOST_S = 2.0;

/** Stuck detection window: a creep must cover this distance (m) inside
 *  the window, otherwise the pursuit is treated as lost (wall-blocked). */
export const CREEP_STUCK_WINDOW_S = 1.5;
export const CREEP_STUCK_MIN_DISTANCE = 0.3;

/** Chase path recomputation cadence (s) and the player-move trigger (m). */
export const CREEP_CHASE_REPATH_S = 0.5;
export const CREEP_CHASE_REPATH_MOVE = 1.5;

/** Distance (m) to consume a nav-path waypoint / arrive at the return target. */
export const CREEP_PATH_WAYPOINT_RADIUS = 0.35;
export const CREEP_RETURN_ARRIVE_DISTANCE = 0.35;

/* ═══════════════════════════════════════════════════════════════
   Line of sight (segment vs AABB, slab method)
   ═══════════════════════════════════════════════════════════════ */

/**
 * Segment-vs-AABB intersection (slab method) in the XZ plane.
 * Returns true when the segment [a→b] crosses (or lies inside) the box.
 * Endpoints exactly on a face count as blocked (touching = blocked).
 */
export function segmentIntersectsAabb(
  ax: number,
  az: number,
  bx: number,
  bz: number,
  aabb: NpcObstacleAabb,
): boolean {
  const dx = bx - ax;
  const dz = bz - az;
  let tmin = 0;
  let tmax = 1;

  // X slab
  if (Math.abs(dx) < 1e-9) {
    if (ax < aabb.minX || ax > aabb.maxX) return false;
  } else {
    const invDx = 1 / dx;
    let tx1 = (aabb.minX - ax) * invDx;
    let tx2 = (aabb.maxX - ax) * invDx;
    if (tx1 > tx2) {
      const tmp = tx1;
      tx1 = tx2;
      tx2 = tmp;
    }
    if (tx1 > tmin) tmin = tx1;
    if (tx2 < tmax) tmax = tx2;
    if (tmin > tmax) return false;
  }

  // Z slab
  if (Math.abs(dz) < 1e-9) {
    if (az < aabb.minZ || az > aabb.maxZ) return false;
  } else {
    const invDz = 1 / dz;
    let tz1 = (aabb.minZ - az) * invDz;
    let tz2 = (aabb.maxZ - az) * invDz;
    if (tz1 > tz2) {
      const tmp = tz1;
      tz1 = tz2;
      tz2 = tmp;
    }
    if (tz1 > tmin) tmin = tz1;
    if (tz2 < tmax) tmax = tz2;
    if (tmin > tmax) return false;
  }

  return tmin <= tmax;
}

/**
 * Check direct visibility between two XZ points against vision blockers.
 * True = the creep can see the player (no wall on the sight line).
 * An empty blocker list (scenes without tall colliders) is always clear.
 */
export function hasCreepLineOfSight(
  fromX: number,
  fromZ: number,
  toX: number,
  toZ: number,
  blockers: readonly NpcObstacleAabb[],
): boolean {
  for (const blocker of blockers) {
    // Cheap reject: a blocker can only intersect the sight line when it
    // overlaps the segment's bounding box.
    if (
      Math.max(fromX, toX) < blocker.minX || Math.min(fromX, toX) > blocker.maxX ||
      Math.max(fromZ, toZ) < blocker.minZ || Math.min(fromZ, toZ) > blocker.maxZ
    ) {
      continue;
    }
    if (segmentIntersectsAabb(fromX, fromZ, toX, toZ, blocker)) return false;
  }
  return true;
}

/**
 * Collect vision blockers (walls + tall props) from a scene definition.
 * Uses the same rotation-aware AABB conversion as the NPC avoidance layer,
 * but with a taller height threshold — low props hide neither creeps nor
 * the player, so they must not block sight lines.
 */
export function filterVisionBlockers(scene: {
  walls?: readonly ColliderDef[];
  obstacles?: readonly ColliderDef[];
}): NpcObstacleAabb[] {
  const combined: ColliderDef[] = [];
  if (scene.walls) combined.push(...scene.walls);
  if (scene.obstacles) combined.push(...scene.obstacles);

  const out: NpcObstacleAabb[] = [];
  for (const collider of combined) {
    if (collider.type !== 'cuboidObstacle') continue;
    // size[1] is the half-height — compare the FULL height.
    if (collider.size[1] * 2 < VISION_BLOCKER_MIN_HEIGHT) continue;
    out.push(obstacleToAabb(collider));
  }
  return out;
}

/* ═══════════════════════════════════════════════════════════════
   Leash (WoW-style chase range)
   ═══════════════════════════════════════════════════════════════ */

/**
 * True when the player has moved farther than `leashRange` from the point
 * where the chase began — the creep gives up and returns to its patrol.
 * Strictly greater-than so leashing exactly at the boundary still chases.
 */
export function isPlayerBeyondLeash(
  originX: number,
  originZ: number,
  playerX: number,
  playerZ: number,
  leashRange: number,
): boolean {
  return Math.hypot(playerX - originX, playerZ - originZ) > leashRange;
}

/* ═══════════════════════════════════════════════════════════════
   Ranged kiting
   ═══════════════════════════════════════════════════════════════ */

/** Kiting movement decision for a chasing ranged creep. */
export type CreepKiteMove = 'approach' | 'retreat' | 'hold';

/**
 * Decide how a ranged creep should move while chasing:
 *   - 'retreat'  — player closer than minPreferredDistance, back away;
 *   - 'hold'     — player inside the preferred band, stand and shoot;
 *   - 'approach' — player beyond preferredDistance, close in.
 * Non-kiting (melee) creeps always approach.
 */
export function resolveKiteMove(playerDistance: number, config: EnemyAiConfig): CreepKiteMove {
  if (!config.kitingEnabled) return 'approach';
  if (playerDistance < config.minPreferredDistance) return 'retreat';
  if (playerDistance > config.preferredDistance) return 'approach';
  return 'hold';
}

/**
 * Whether a ranged creep may open the turn-based encounter right now —
 * the player stands inside its preferred firing band (5–7 m for
 * ranged_strelkov, 4–6 m for censor_drone — see enemyAiBehaviors.ts).
 */
export function isWithinRangedEngageBand(playerDistance: number, config: EnemyAiConfig): boolean {
  return (
    config.kitingEnabled &&
    playerDistance >= config.minPreferredDistance &&
    playerDistance <= config.preferredDistance
  );
}

/**
 * Retreat direction for a kiting creep crowded by the player: away from
 * the player, biased toward its patrol home point when the home lies
 * roughly behind the creep (so retreats read as "heading back to post").
 * Returns a normalized direction.
 */
export function resolveRetreatDirection(
  creepX: number,
  creepZ: number,
  playerX: number,
  playerZ: number,
  homeX: number,
  homeZ: number,
): { dirX: number; dirZ: number } {
  const awayX = creepX - playerX;
  const awayZ = creepZ - playerZ;
  const awayLen = Math.hypot(awayX, awayZ);

  // Degenerate: creep exactly on the player — head for home (or +Z).
  if (awayLen < 1e-6) {
    const hx = homeX - creepX;
    const hz = homeZ - creepZ;
    const hLen = Math.hypot(hx, hz);
    if (hLen < 1e-6) return { dirX: 0, dirZ: 1 };
    return { dirX: hx / hLen, dirZ: hz / hLen };
  }

  const ax = awayX / awayLen;
  const az = awayZ / awayLen;

  const hx = homeX - creepX;
  const hz = homeZ - creepZ;
  const hLen = Math.hypot(hx, hz);
  if (hLen > 1e-6) {
    const nx = hx / hLen;
    const nz = hz / hLen;
    // Blend toward home only when home is roughly behind the creep
    // (moving there also opens the distance to the player).
    if (nx * ax + nz * az > 0.25) {
      const bx = ax * 0.5 + nx * 0.5;
      const bz = az * 0.5 + nz * 0.5;
      const bLen = Math.hypot(bx, bz);
      if (bLen > 1e-6) return { dirX: bx / bLen, dirZ: bz / bLen };
    }
  }

  return { dirX: ax, dirZ: az };
}

/* ═══════════════════════════════════════════════════════════════
   Waypoints & stuck detection
   ═══════════════════════════════════════════════════════════════ */

/** Index of the patrol waypoint nearest to (x, z) — the "home" target
 *  for the return state after a chase is given up. */
export function nearestWaypointIndex(
  waypoints: ReadonlyArray<readonly [number, number]>,
  x: number,
  z: number,
): number {
  let best = 0;
  let bestDistSq = Infinity;
  for (let i = 0; i < waypoints.length; i++) {
    const distSq = (waypoints[i][0] - x) ** 2 + (waypoints[i][1] - z) ** 2;
    if (distSq < bestDistSq) {
      bestDistSq = distSq;
      best = i;
    }
  }
  return best;
}

/** Rolling stuck tracker — sample position every window seconds. */
export interface CreepStuckTracker {
  elapsedS: number;
  lastX: number;
  lastZ: number;
}

export function createCreepStuckTracker(x: number, z: number): CreepStuckTracker {
  return { elapsedS: 0, lastX: x, lastZ: z };
}

/**
 * Advance the stuck tracker. Returns true when the creep failed to cover
 * `minDistance` within `windowS` (and resets the window so the flag fires
 * at most once per window). Call only while the creep is trying to move.
 */
export function updateCreepStuckTracker(
  tracker: CreepStuckTracker,
  x: number,
  z: number,
  delta: number,
  windowS: number = CREEP_STUCK_WINDOW_S,
  minDistance: number = CREEP_STUCK_MIN_DISTANCE,
): boolean {
  tracker.elapsedS += delta;
  if (tracker.elapsedS < windowS) return false;
  const moved = Math.hypot(x - tracker.lastX, z - tracker.lastZ);
  tracker.elapsedS = 0;
  tracker.lastX = x;
  tracker.lastZ = z;
  return moved < minDistance;
}

/* ═══════════════════════════════════════════════════════════════
   Nav-mesh paths for pursuit & return
   ═══════════════════════════════════════════════════════════════ */

/**
 * Resolve the cached nav mesh for a scene (built once per scene by
 * navMeshCache). Returns null when the scene has no walkable grid —
 * callers then fall back to direct pursuit with obstacle steering.
 */
export function resolveCreepNavMesh(sceneId: string): NavMeshGraph | null {
  try {
    const mesh = getNavMeshForScene(sceneId);
    return mesh.cells.size > 0 ? mesh : null;
  } catch {
    return null;
  }
}

/**
 * Compute a wall-aware path from (fromX, fromZ) to (toX, toZ) on the nav
 * mesh. Returns XZ waypoints WITHOUT the start point (the creep is already
 * there), or null when no mesh / no path — the caller should then move
 * directly toward the target.
 */
export function computeCreepNavPath(
  fromX: number,
  fromZ: number,
  toX: number,
  toZ: number,
  navMesh: NavMeshGraph | null,
): Array<[number, number]> | null {
  if (!navMesh || navMesh.cells.size === 0) return null;
  const result = findNavMeshPath(fromX, fromZ, toX, toZ, 0, navMesh);
  if (!result.found || result.waypoints.length < 2) return null;
  return result.waypoints.slice(1).map((wp) => [wp[0], wp[2]] as [number, number]);
}
