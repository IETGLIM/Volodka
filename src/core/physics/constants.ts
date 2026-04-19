/**
 * Shared exploration locomotion / capsule tuning (Rapier kinematic character).
 * Consumed by `CharacterController` and legacy call sites via `@/hooks/useGamePhysics`.
 */
export const PHYSICS_CONSTANTS = {
  WALK_SPEED: 3.5,
  RUN_SPEED: 6.0,

  PLAYER_HEIGHT: 1.8,
  PLAYER_RADIUS: 0.4,

  GRAVITY: -20,
  JUMP_FORCE: 8,
  GROUND_FRICTION: 0.1,
  AIR_FRICTION: 0.05,

  CAMERA_DISTANCE: 5,
  CAMERA_HEIGHT: 2,
  CAMERA_SMOOTHING: 0.1,
} as const;
