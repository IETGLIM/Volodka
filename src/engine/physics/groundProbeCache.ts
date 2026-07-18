import type { RapierCollider, RapierRigidBody } from '@react-three/rapier';
import {
  probeGroundY,
  type GroundProbeRapier,
  type GroundProbeWorld,
} from '@/engine/physics/groundProbe';

/** Horizontal distance (m) before re-probing walkable ground. */
export const GROUND_PROBE_HORIZ_THRESHOLD = 0.45;
/** Max age (s) of a cached ground Y sample while grounded.
 *  Must be shorter than COYOTE_TIME (0.15s) so coyote detection is reliable. */
export const GROUND_PROBE_REFRESH_INTERVAL_S = 0.08;
/** M6: Vertical distance (m) of upward Y change that forces a ground reprobe.
 *  Catches the player stepping onto a raised surface (autostep, ramp) where
 *  horizontal distance alone may not exceed the threshold. */
export const GROUND_PROBE_VERT_UP_THRESHOLD = 0.3;

export interface GroundProbeCacheState {
  groundY: number;
  probeX: number;
  probeZ: number;
  probeY: number;
  sceneId: string;
  timeSinceProbe: number;
  forceRefresh: boolean;
}

export function createGroundProbeCache(
  fallbackFloorY: number,
  sceneId: string,
): GroundProbeCacheState {
  return {
    groundY: fallbackFloorY,
    probeX: Number.NaN,
    probeZ: Number.NaN,
    probeY: Number.NaN,
    sceneId,
    timeSinceProbe: Number.POSITIVE_INFINITY,
    forceRefresh: true,
  };
}

export function invalidateGroundProbeCache(cache: GroundProbeCacheState): void {
  cache.forceRefresh = true;
  cache.timeSinceProbe = Number.POSITIVE_INFINITY;
}

export function shouldRefreshGroundProbe(
  cache: GroundProbeCacheState,
  sceneId: string,
  x: number,
  y: number,
  z: number,
  airborne: boolean,
): boolean {
  if (cache.forceRefresh) return true;
  if (cache.sceneId !== sceneId) return true;
  if (airborne) return true;
  if (Number.isNaN(cache.probeX)) return true;

  const dx = x - cache.probeX;
  const dz = z - cache.probeZ;
  if (dx * dx + dz * dz > GROUND_PROBE_HORIZ_THRESHOLD * GROUND_PROBE_HORIZ_THRESHOLD) {
    return true;
  }
  // M6: Upward Y change (autostep, ramp, raised platform) forces a reprobe
  // even if horizontal distance hasn't changed enough.
  if (!Number.isNaN(cache.probeY) && (y - cache.probeY) > GROUND_PROBE_VERT_UP_THRESHOLD) {
    return true;
  }
  // Also catch significant downward Y changes (fell through weak floor, etc.)
  if (!Number.isNaN(cache.probeY) && (cache.probeY - y) > GROUND_PROBE_VERT_UP_THRESHOLD) {
    return true;
  }
  if (cache.timeSinceProbe >= GROUND_PROBE_REFRESH_INTERVAL_S) return true;
  return false;
}

export interface ResolveCachedGroundYParams {
  sceneId: string;
  x: number;
  feetY: number;
  z: number;
  fallbackFloorY: number;
  dt: number;
  airborne: boolean;
  excludeCollider?: RapierCollider | null;
  excludeRigidBody?: RapierRigidBody | null;
}

/** Returns cached ground Y, raycasting only when the cache is stale. */
export function resolveCachedGroundY(
  world: GroundProbeWorld,
  rapier: GroundProbeRapier,
  cache: GroundProbeCacheState,
  params: ResolveCachedGroundYParams,
): number {
  cache.timeSinceProbe += params.dt;

  if (shouldRefreshGroundProbe(cache, params.sceneId, params.x, params.feetY, params.z, params.airborne)) {
    cache.groundY = probeGroundY(
      world,
      rapier,
      params.x,
      params.feetY,
      params.z,
      params.fallbackFloorY,
      params.excludeCollider,
      params.excludeRigidBody,
    );
    // PHYS-3: Validate cached groundY — if probeGroundY ever returns NaN
    // (e.g., malformed Rapier hit), use the fallback to prevent position
    // collapse or false rescue teleports.
    if (!Number.isFinite(cache.groundY)) {
      cache.groundY = params.fallbackFloorY;
    }
    cache.probeX = params.x;
    cache.probeZ = params.z;
    cache.probeY = params.feetY;
    cache.sceneId = params.sceneId;
    cache.timeSinceProbe = 0;
    cache.forceRefresh = false;
  }

  return cache.groundY;
}
