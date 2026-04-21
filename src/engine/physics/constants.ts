/**
 * Shared exploration locomotion / capsule tuning (Rapier kinematic character).
 * Consumed by `CharacterController` and legacy call sites via `@/hooks/useGamePhysics`.
 */
export const PHYSICS_CONSTANTS = {
  WALK_SPEED: 3.5,
  RUN_SPEED: 6.0,

  /** Высота капсулы KCC (м); чуть выше визуала, чтобы голова реже «пробивала» потолок при прыжке. */
  PLAYER_HEIGHT: 1.92,
  PLAYER_RADIUS: 0.4,

  GRAVITY: -20,
  JUMP_FORCE: 6.5,
  /** Потолок восходящей скорости в воздухе (м/с); вместе с меньшим `JUMP_FORCE` снижает клип через потолок. */
  MAX_UPWARD_SPEED: 6.85,
  GROUND_FRICTION: 0.1,
  AIR_FRICTION: 0.05,

  CAMERA_DISTANCE: 5,
  CAMERA_HEIGHT: 2,
  CAMERA_SMOOTHING: 0.1,
} as const;
