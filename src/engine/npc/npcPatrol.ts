/* ─── Volodka RPG – NPC Patrol/Wandering Engine ─── */
/* Manages patrol state for NPCs that wander between waypoints.
 * Each NPC with patrolWaypoints will cycle through them,
 * idling at each for a random duration (2-5 seconds) before
 * walking to the next. NPCs face the direction they're walking.
 *
 * NAV MESH INTEGRATION:
 *   When a waypoint is far away (>2 m), the patrol engine computes an
 *   A* path through the nav mesh and stores it in `pathQueue`. The NPC
 *   then walks through each intermediate waypoint sequentially. This
 *   produces natural detour paths around walls instead of the old
 *   ray-avoidance steering which could get NPCs stuck.
 *
 *   For close waypoints (<2 m), or when no nav mesh is available, the
 *   NPC falls back to direct interpolation (same as before). The ray-
 *   avoidance system is still active as a micro-level steer when no
 *   pathQueue is in use. */

import * as THREE from 'three';
import {
  resolveNpcObstacleAvoidance,
  type NpcObstacleAabb,
} from './npcObstacleAvoidance';
import { findNavMeshPath, type NavMeshPathResult } from './navMeshPathfinder';
import { getNavMeshForScene } from './navMeshCache';
import type { NavMeshGraph } from './navMeshBuilder';

/* ─── Constants ─── */
const MIN_IDLE_DURATION = 2.0;  // seconds
const MAX_IDLE_DURATION = 5.0;  // seconds
const DEFAULT_WALK_SPEED = 1.2; // units per second
const ARRIVAL_THRESHOLD = 0.15; // distance to consider "arrived" at waypoint
const ROTATION_LERP_SPEED = 4.0; // how fast NPC turns to face movement direction
/** Distance threshold for nav mesh path computation — waypoints >2 m away
 *  get A* paths; closer ones use direct interpolation. */
const NAV_MESH_PATH_THRESHOLD = 2.0;

/* ─── Patrol State ─── */
export interface PatrolState {
  /** Index of the current target waypoint */
  currentWaypointIndex: number;
  /** Current movement phase: 'idle' (waiting at waypoint) or 'walking' (moving to next) */
  phase: 'idle' | 'walking';
  /** Seconds remaining in idle phase */
  idleTimer: number;
  /** Current interpolated world position */
  position: THREE.Vector3;
  /** Current Y-axis rotation (radians) */
  rotationY: number;
  /** Target Y-axis rotation for smooth turning */
  targetRotationY: number;
  /** Whether the patrol system has been initialized */
  initialized: boolean;
  /** Random idle duration for current idle phase */
  currentIdleDuration: number;
  /** Pre-allocated temps for updatePatrol (no per-frame Vector3 alloc). */
  targetPos: THREE.Vector3;
  direction: THREE.Vector3;
  /** Nav mesh path queue — intermediate waypoints from A* pathfinding.
   *  When set, the NPC walks through these sequentially before reaching
   *  the final patrol waypoint. Cleared when the final waypoint is reached. */
  pathQueue?: [number, number, number][];
  /** Current index within pathQueue (0 = first intermediate waypoint). */
  currentPathIndex: number;
}

/** Create a new patrol state starting at the first waypoint */
export function createPatrolState(
  waypoints: [number, number, number][],
  basePosition: [number, number, number],
): PatrolState {
  const startPos = waypoints.length > 0 ? waypoints[0] : basePosition;
  return {
    currentWaypointIndex: 0,
    phase: 'idle',
    idleTimer: randomIdleDuration(),
    position: new THREE.Vector3(startPos[0], startPos[1], startPos[2]),
    rotationY: 0,
    targetRotationY: 0,
    initialized: true,
    currentIdleDuration: randomIdleDuration(),
    targetPos: new THREE.Vector3(startPos[0], startPos[1], startPos[2]),
    direction: new THREE.Vector3(),
    pathQueue: undefined,
    currentPathIndex: 0,
  };
}

/** Get a random idle duration between MIN and MAX */
function randomIdleDuration(): number {
  return MIN_IDLE_DURATION + Math.random() * (MAX_IDLE_DURATION - MIN_IDLE_DURATION);
}

/** Calculate the Y rotation to face from one position toward another */
function calculateFacingAngle(from: THREE.Vector3, to: THREE.Vector3): number {
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  return Math.atan2(dx, dz);
}

/**
 * Compute a nav mesh path from the NPC's current position to a target waypoint.
 * Returns an array of world-space waypoints (including start and end), or an
 * empty array if no path is found or the nav mesh isn't available.
 *
 * Called when transitioning from idle → walking and the waypoint is far away.
 */
export function computePatrolPath(
  currentPos: THREE.Vector3,
  targetWaypoint: [number, number, number],
  sceneId: string,
  floorY: number,
): [number, number, number][] {
  let navMesh: NavMeshGraph;
  try {
    navMesh = getNavMeshForScene(sceneId);
  } catch {
    return []; // Nav mesh unavailable — fall back to direct interpolation.
  }

  if (navMesh.cells.size === 0) return []; // Empty graph — no pathfinding possible.

  const result: NavMeshPathResult = findNavMeshPath(
    currentPos.x,
    currentPos.z,
    targetWaypoint[0],
    targetWaypoint[2],
    floorY,
    navMesh,
  );

  if (!result.found || result.waypoints.length < 2) {
    return []; // No path found — fall back.
  }

  // Strip the first waypoint (it's the start position, NPC is already there).
  // Keep all intermediate waypoints and the final target.
  return result.waypoints.slice(1);
}

/**
 * Update patrol state for one frame.
 * Returns the updated state (mutated in place for performance).
 * Also returns the current activity ('idle' or 'walk') for animation control.
 *
 * Optional `obstacles` enables wall avoidance: when provided, the NPC casts a
 * short forward ray and steers around any `cuboidObstacle` AABBs instead of
 * walking through walls.
 *
 * Optional `sceneId` and `floorY` enable nav mesh pathfinding: when the
 * target waypoint is far (>2 m), A* computes a detour path around walls.
 */
export function updatePatrol(
  state: PatrolState,
  waypoints: [number, number, number][],
  delta: number,
  walkSpeed: number = DEFAULT_WALK_SPEED,
  obstacles?: readonly NpcObstacleAabb[],
  sceneId?: string,
  floorY?: number,
): { activity: 'idle' | 'walk' } {
  if (waypoints.length === 0) {
    return { activity: 'idle' };
  }

  // Handle single waypoint — just idle at it
  if (waypoints.length === 1) {
    const wp = waypoints[0];
    state.position.set(wp[0], wp[1], wp[2]);
    state.phase = 'idle';
    return { activity: 'idle' };
  }

  if (state.phase === 'idle') {
    // Count down idle timer
    state.idleTimer -= delta;
    if (state.idleTimer <= 0) {
      // Time to walk to next waypoint
      state.phase = 'walking';
      const nextIndex = (state.currentWaypointIndex + 1) % waypoints.length;
      state.currentWaypointIndex = nextIndex;

      // ── Nav mesh path computation ──
      // If the waypoint is far away and nav mesh is available, compute a path.
      const target = waypoints[nextIndex];
      state.targetPos.set(target[0], target[1], target[2]);
      const distToTarget = state.position.distanceTo(state.targetPos);

      // Clear any previous path queue.
      state.pathQueue = undefined;
      state.currentPathIndex = 0;

      if (distToTarget > NAV_MESH_PATH_THRESHOLD && sceneId && floorY !== undefined) {
        const pathPoints = computePatrolPath(
          state.position,
          target,
          sceneId,
          floorY,
        );
        if (pathPoints.length > 0) {
          state.pathQueue = pathPoints;
          state.currentPathIndex = 0;
          // Set initial target to first path queue waypoint.
          const firstPathPoint = pathPoints[0];
          state.targetPos.set(firstPathPoint[0], firstPathPoint[1], firstPathPoint[2]);
          state.targetRotationY = calculateFacingAngle(state.position, state.targetPos);
        } else {
          // No path found — use direct interpolation.
          state.targetRotationY = calculateFacingAngle(state.position, state.targetPos);
        }
      } else {
        // Close waypoint or no nav mesh — direct interpolation.
        state.targetRotationY = calculateFacingAngle(state.position, state.targetPos);
      }
    }
  }

  if (state.phase === 'walking') {
    // ── Determine the current movement target ──
    // If we have a path queue, walk toward the current intermediate waypoint.
    // Otherwise, walk directly toward the final patrol waypoint.
    let moveTarget: THREE.Vector3;
    let isFollowingPathQueue = false;

    if (state.pathQueue && state.currentPathIndex < state.pathQueue.length) {
      // Walking through nav mesh intermediate waypoints.
      const pathPoint = state.pathQueue[state.currentPathIndex];
      state.targetPos.set(pathPoint[0], pathPoint[1], pathPoint[2]);
      moveTarget = state.targetPos;
      isFollowingPathQueue = true;
    } else {
      // Walking directly toward final patrol waypoint (no path queue or queue exhausted).
      const targetWP = waypoints[state.currentWaypointIndex];
      state.targetPos.set(targetWP[0], targetWP[1], targetWP[2]);
      moveTarget = state.targetPos;
    }

    state.direction.subVectors(moveTarget, state.position);
    const distance = state.direction.length();

    // ── Check arrival at current target ──
    if (isFollowingPathQueue && distance < ARRIVAL_THRESHOLD) {
      // Arrived at an intermediate path queue waypoint.
      state.currentPathIndex++;

      // Check if we've exhausted the path queue.
      if (state.currentPathIndex >= (state.pathQueue?.length ?? 0)) {
        // Path queue exhausted — arrive at final patrol waypoint.
        const finalWP = waypoints[state.currentWaypointIndex];
        state.position.set(finalWP[0], finalWP[1], finalWP[2]);
        state.phase = 'idle';
        state.idleTimer = randomIdleDuration();
        state.currentIdleDuration = state.idleTimer;
        state.pathQueue = undefined;
        state.currentPathIndex = 0;
      } else {
        // Move to next intermediate waypoint.
        const nextPathPoint = state.pathQueue![state.currentPathIndex];
        state.targetPos.set(nextPathPoint[0], nextPathPoint[1], nextPathPoint[2]);
        state.targetRotationY = calculateFacingAngle(state.position, state.targetPos);
      }
    } else if (!isFollowingPathQueue && distance < ARRIVAL_THRESHOLD) {
      // Arrived at final patrol waypoint (direct walk, no path queue).
      state.position.copy(state.targetPos);
      state.phase = 'idle';
      state.idleTimer = randomIdleDuration();
      state.currentIdleDuration = state.idleTimer;
      state.pathQueue = undefined;
      state.currentPathIndex = 0;
    } else {
      // ── Move toward target ──
      // When following path queue, no obstacle avoidance needed (path is pre-computed).
      // When walking directly, use ray-avoidance as before.
      const dirX = state.direction.x / distance;
      const dirZ = state.direction.z / distance;

      let effectiveDirX = dirX;
      let effectiveDirZ = dirZ;
      let speedScale = 1;

      // Only use ray-avoidance when NOT following a pre-computed path.
      // The nav mesh path already avoids obstacles; ray-avoidance would
      // fight against the planned path and cause jittering.
      if (!isFollowingPathQueue && obstacles && obstacles.length > 0) {
        const avoidance = resolveNpcObstacleAvoidance(
          state.position.x,
          state.position.z,
          dirX,
          dirZ,
          obstacles,
        );
        effectiveDirX = avoidance.dirX;
        effectiveDirZ = avoidance.dirZ;
        speedScale = avoidance.speedScale;
      }

      // Move toward (possibly steered) direction
      const moveDistance = Math.min(walkSpeed * speedScale * delta, distance);
      state.position.x += effectiveDirX * moveDistance;
      state.position.z += effectiveDirZ * moveDistance;

      // Update facing direction while walking (toward the effective direction
      // so the NPC visually turns toward the steered path).
      state.targetRotationY = Math.atan2(effectiveDirX, effectiveDirZ);
    }
  }

  // Smooth rotation interpolation (always lerp toward target)
  let rotationDiff = state.targetRotationY - state.rotationY;
  // Normalize to [-PI, PI] for shortest rotation path
  while (rotationDiff > Math.PI) rotationDiff -= Math.PI * 2;
  while (rotationDiff < -Math.PI) rotationDiff += Math.PI * 2;
  state.rotationY += rotationDiff * Math.min(1, ROTATION_LERP_SPEED * delta);

  return { activity: state.phase === 'walking' ? 'walk' : 'idle' };
}

/**
 * Check if an NPC should be patrolling based on its definition and current activity.
 * NPCs should NOT patrol during interactions or during schedule activities like 'sleep', 'work', etc.
 * Only patrol when the schedule activity is 'idle', 'walk', or 'rest'.
 */
export function shouldPatrol(
  scheduleActivity: string,
  isInteractionTarget: boolean,
  hasWaypoints: boolean,
): boolean {
  if (!hasWaypoints) return false;
  if (isInteractionTarget) return false;

  // Only patrol during activities that allow movement
  const patrollableActivities = ['idle', 'walk', 'rest'];
  return patrollableActivities.includes(scheduleActivity);
}
