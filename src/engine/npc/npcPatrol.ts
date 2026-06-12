/* ─── Volodka RPG – NPC Patrol/Wandering Engine ─── */
/* Manages patrol state for NPCs that wander between waypoints.
 * Each NPC with patrolWaypoints will cycle through them,
 * idling at each for a random duration (2-5 seconds) before
 * walking to the next. NPCs face the direction they're walking. */

import * as THREE from 'three';

/* ─── Constants ─── */
const MIN_IDLE_DURATION = 2.0;  // seconds
const MAX_IDLE_DURATION = 5.0;  // seconds
const DEFAULT_WALK_SPEED = 1.2; // units per second
const ARRIVAL_THRESHOLD = 0.15; // distance to consider "arrived" at waypoint
const ROTATION_LERP_SPEED = 4.0; // how fast NPC turns to face movement direction

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
 * Update patrol state for one frame.
 * Returns the updated state (mutated in place for performance).
 * Also returns the current activity ('idle' or 'walk') for animation control.
 */
export function updatePatrol(
  state: PatrolState,
  waypoints: [number, number, number][],
  delta: number,
  walkSpeed: number = DEFAULT_WALK_SPEED,
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

      // Calculate facing direction toward next waypoint
      const target = waypoints[nextIndex];
      state.targetPos.set(target[0], target[1], target[2]);
      state.targetRotationY = calculateFacingAngle(state.position, state.targetPos);
    }
  }

  if (state.phase === 'walking') {
    const targetWP = waypoints[state.currentWaypointIndex];
    state.targetPos.set(targetWP[0], targetWP[1], targetWP[2]);
    state.direction.subVectors(state.targetPos, state.position);
    const distance = state.direction.length();

    if (distance < ARRIVAL_THRESHOLD) {
      // Arrived at waypoint
      state.position.copy(state.targetPos);
      state.phase = 'idle';
      state.idleTimer = randomIdleDuration();
      state.currentIdleDuration = state.idleTimer;
    } else {
      // Move toward waypoint
      const moveDistance = Math.min(walkSpeed * delta, distance);
      state.position.addScaledVector(state.direction, moveDistance / distance);

      // Update facing direction while walking
      state.targetRotationY = calculateFacingAngle(state.position, state.targetPos);
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
