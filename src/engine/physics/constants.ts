/**
 * Shared exploration locomotion / capsule tuning (Rapier kinematic character).
 * Consumed by `CharacterController` and legacy call sites via `@/hooks/useGamePhysics`.
 */
export const PHYSICS_CONSTANTS = {
  WALK_SPEED: 2.6,
  RUN_SPEED: 5.2,

  /** Высота капсулы KCC (м); чуть выше визуала, чтобы голова реже «пробивала» потолок при прыжке. */
  PLAYER_HEIGHT: 1.92,
  PLAYER_RADIUS: 0.35,

  GRAVITY: -18,
  JUMP_FORCE: 6.5,
  /** Потолок восходящей скорости в воздухе (м/с); вместе с меньшим `JUMP_FORCE` снижает клип через потолок. */
  MAX_UPWARD_SPEED: 6.85,
} as const;
