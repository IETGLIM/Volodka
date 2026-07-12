/**
 * NPC obstacle avoidance — pure math, no Rapier dependency.
 *
 * The patrol engine (npcPatrol.ts) moves NPCs between waypoints by linear
 * interpolation. Without obstacle awareness, NPCs walk through walls, tables,
 * and props — anything declared as a `cuboidObstacle` in sceneDefinitions.
 *
 * This module provides a lightweight ray-vs-AABB intersection test and a
 * steer-around fallback so NPCs detour around blocking obstacles instead of
 * clipping through them. It is intentionally pure (no Three.js, no Rapier)
 * so it can be unit-tested in isolation and runs in the NPC frame batch
 * without touching the physics world.
 *
 * Strategy:
 *   1. Cast a short forward ray (1.0–1.5 m) from the NPC's chest height.
 *   2. If the ray hits an obstacle AABB, compute the hit normal.
 *   3. Steer the movement direction toward the obstacle normal's perpendicular
 *      (the "slide along the wall" vector) so the NPC skirts the edge.
 *   4. If both perpendiculars are blocked (narrow corridor), slow down and
 *      let the patrol engine snap to the next waypoint when close enough.
 */

import type { ColliderDef } from '@/shared/types/sceneDefinition';

/** Tightened obstacle shape for NPC avoidance (2D, top-down). */
export interface NpcObstacleAabb {
  /** Min X (world). */
  minX: number;
  /** Max X (world). */
  maxX: number;
  /** Min Z (world). */
  minZ: number;
  /** Max Z (world). */
  maxZ: number;
}

/** NPC chest height — rays cast at this Y to hit walls but skip low props. */
const NPC_RAY_HEIGHT = 1.0;
/** How far ahead the NPC looks for obstacles (metres). */
const NPC_LOOKAHEAD_DISTANCE = 1.2;
/** Extra clearance kept from obstacle surfaces (metres). */
const NPC_CLEARANCE = 0.25;
/** Min steer magnitude before it is applied (prevents jitter). */
const MIN_STEER_MAGNITUDE = 0.05;

/**
 * Convert a scene obstacle collider (with optional rotation) to a 2D AABB.
 * Rotation is handled approximately: 0 and π/2 are exact (swap half-extents),
 * any other angle falls back to the rotated rectangle's bounding box.
 */
export function obstacleToAabb(obstacle: ColliderDef): NpcObstacleAabb {
  const [halfW, , halfD] = obstacle.size;
  const [cx, , cz] = obstacle.position;
  const rot = obstacle.rotation ?? 0;

  let halfWidth = halfW;
  let halfDepth = halfD;

  // Normalize rotation to [0, π) and handle the two common cases exactly.
  const normalized = ((rot % Math.PI) + Math.PI) % Math.PI;
  const isQuarterTurn = Math.abs(normalized - Math.PI / 2) < 0.01;
  if (isQuarterTurn) {
    halfWidth = halfD;
    halfDepth = halfW;
  } else if (normalized > 0.01 && !isQuarterTurn) {
    // Arbitrary angle: take the bounding box of the rotated rectangle.
    const cos = Math.abs(Math.cos(rot));
    const sin = Math.abs(Math.sin(rot));
    halfWidth = halfW * cos + halfD * sin;
    halfDepth = halfW * sin + halfD * cos;
  }

  return {
    minX: cx - halfWidth,
    maxX: cx + halfWidth,
    minZ: cz - halfDepth,
    maxZ: cz + halfDepth,
  };
}

/**
 * Ray-vs-AABB intersection (slab method) in 2D (XZ plane).
 * Returns the hit time (0..1 over the ray length) and the surface normal,
 * or null if the ray misses the box.
 *
 * The ray origin and direction are in world space; direction must be
 * normalized (caller responsibility).
 */
export function rayAabbIntersect(
  originX: number,
  originZ: number,
  dirX: number,
  dirZ: number,
  aabb: NpcObstacleAabb,
): { t: number; normalX: number; normalZ: number } | null {
  // Slab method for 2D AABB.
  let tmin = 0;
  let tmax = Infinity;
  let normalX = 0;
  let normalZ = 0;

  // X slab
  if (Math.abs(dirX) < 1e-8) {
    // Parallel to X slab — miss if origin outside.
    if (originX < aabb.minX || originX > aabb.maxX) return null;
  } else {
    const invDx = 1 / dirX;
    let tx1 = (aabb.minX - originX) * invDx;
    let tx2 = (aabb.maxX - originX) * invDx;
    let nx = -1; // normal points in -X when entering from minX side
    if (tx1 > tx2) {
      const tmp = tx1;
      tx1 = tx2;
      tx2 = tmp;
      nx = 1;
    }
    if (tx1 > tmin) {
      tmin = tx1;
      normalX = nx;
      normalZ = 0;
    }
    if (tx2 < tmax) tmax = tx2;
    if (tmin > tmax) return null;
  }

  // Z slab
  if (Math.abs(dirZ) < 1e-8) {
    if (originZ < aabb.minZ || originZ > aabb.maxZ) return null;
  } else {
    const invDz = 1 / dirZ;
    let tz1 = (aabb.minZ - originZ) * invDz;
    let tz2 = (aabb.maxZ - originZ) * invDz;
    let nz = -1;
    if (tz1 > tz2) {
      const tmp = tz1;
      tz1 = tz2;
      tz2 = tmp;
      nz = 1;
    }
    if (tz1 > tmin) {
      tmin = tz1;
      normalX = 0;
      normalZ = nz;
    }
    if (tz2 < tmax) tmax = tz2;
    if (tmin > tmax) return null;
  }

  // tmin is the entry point; if < 0 the ray origin is inside the box.
  if (tmin < 0) {
    // Origin inside — push out along the nearest face.
    return { t: 0, normalX: -normalX, normalZ: -normalZ };
  }

  return { t: tmin, normalX, normalZ };
}

export interface AvoidanceResult {
  /** Adjusted direction X (normalized). */
  dirX: number;
  /** Adjusted direction Z (normalized). */
  dirZ: number;
  /** Whether an obstacle was detected and steering was applied. */
  avoided: boolean;
  /** Speed multiplier (0..1) — reduced in tight corridors. */
  speedScale: number;
}

/**
 * Resolve obstacle avoidance for an NPC moving in a given direction.
 *
 * Casts a forward ray from the NPC's position; if it hits an obstacle AABB,
 * steers the direction along the obstacle's surface (perpendicular to the
 * hit normal) so the NPC slides around the edge instead of walking through.
 *
 * Returns the (possibly adjusted) direction, whether avoidance was applied,
 * and a speed scale (reduced when the path is partially blocked).
 */
export function resolveNpcObstacleAvoidance(
  posX: number,
  posZ: number,
  dirX: number,
  dirZ: number,
  obstacles: readonly NpcObstacleAabb[],
  lookAhead: number = NPC_LOOKAHEAD_DISTANCE,
): AvoidanceResult {
  if (obstacles.length === 0) {
    return { dirX, dirZ, avoided: false, speedScale: 1 };
  }

  // Normalize direction (caller may pass non-unit vectors).
  const dirLen = Math.hypot(dirX, dirZ);
  if (dirLen < 1e-6) {
    return { dirX: 0, dirZ: 0, avoided: false, speedScale: 0 };
  }
  const ndx = dirX / dirLen;
  const ndz = dirZ / dirLen;

  let nearestT = Infinity;
  let nearestNormalX = 0;
  let nearestNormalZ = 0;

  for (const aabb of obstacles) {
    // Quick reject: if the NPC is already well clear of this AABB, skip.
    const closestX = Math.max(aabb.minX, Math.min(posX, aabb.maxX));
    const closestZ = Math.max(aabb.minZ, Math.min(posZ, aabb.maxZ));
    const distSq = (posX - closestX) ** 2 + (posZ - closestZ) ** 2;
    if (distSq > (lookAhead + NPC_CLEARANCE) ** 2) continue;

    const hit = rayAabbIntersect(posX, posZ, ndx, ndz, aabb);
    if (!hit) continue;
    const worldT = hit.t;
    if (worldT > lookAhead) continue;
    if (worldT < nearestT) {
      nearestT = worldT;
      nearestNormalX = hit.normalX;
      nearestNormalZ = hit.normalZ;
    }
  }

  if (!Number.isFinite(nearestT)) {
    return { dirX: ndx, dirZ: ndz, avoided: false, speedScale: 1 };
  }

  // Steer along the wall: take the normal's perpendicular and pick the side
  // closer to the original movement direction.
  // Perpendicular candidates: (normalZ, -normalX) and (-normalZ, normalX).
  const perp1X = nearestNormalZ;
  const perp1Z = -nearestNormalX;
  const perp2X = -nearestNormalZ;
  const perp2Z = nearestNormalX;

  // Pick the perpendicular that aligns better with the original direction.
  const dot1 = perp1X * ndx + perp1Z * ndz;
  const dot2 = perp2X * ndx + perp2Z * ndz;
  const [steerX, steerZ] = dot1 >= dot2 ? [perp1X, perp1Z] : [perp2X, perp2Z];

  // Blend: mostly steer, but keep a little of the original direction so the
  // NPC doesn't freeze perpendicular to the wall.
  const blend = 0.7;
  let blendedX = steerX * blend + ndx * (1 - blend);
  let blendedZ = steerZ * blend + ndz * (1 - blend);
  const blendedLen = Math.hypot(blendedX, blendedZ);
  if (blendedLen < MIN_STEER_MAGNITUDE) {
    // Path is fully blocked — slow down and let the patrol engine snap.
    return { dirX: ndx, dirZ: ndz, avoided: true, speedScale: 0.2 };
  }
  blendedX /= blendedLen;
  blendedZ /= blendedLen;

  // Reduce speed proportional to how close the obstacle is.
  const proximityFactor = Math.max(0, nearestT / lookAhead);
  const speedScale = Math.min(1, 0.4 + proximityFactor * 0.6);

  return { dirX: blendedX, dirZ: blendedZ, avoided: true, speedScale };
}

/** Filter scene obstacles to only those relevant for NPC avoidance. */
export function filterNpcObstacles(
  obstacles: readonly ColliderDef[],
): NpcObstacleAabb[] {
  const out: NpcObstacleAabb[] = [];
  for (const obs of obstacles) {
    if (obs.type !== 'cuboidObstacle') continue;
    // Skip very low obstacles (under NPC chest height) — they're props, not walls.
    if (obs.size[1] < 0.3) continue;
    out.push(obstacleToAabb(obs));
  }
  return out;
}

/**
 * Build a combined NPC-avoidance obstacle list from a scene's walls + obstacles.
 * Both wall colliders and prop obstacles block NPC movement; merging them here
 * saves the caller from having to concatenate and filter twice.
 */
export function buildNpcAvoidanceObstacles(scene: {
  walls?: readonly ColliderDef[];
  obstacles?: readonly ColliderDef[];
}): NpcObstacleAabb[] {
  const combined: ColliderDef[] = [];
  if (scene.walls) combined.push(...scene.walls);
  if (scene.obstacles) combined.push(...scene.obstacles);
  return filterNpcObstacles(combined);
}

export const NPC_OBSTACLE_AVOIDANCE_RAY_HEIGHT = NPC_RAY_HEIGHT;
