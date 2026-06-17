/** Locomotion and character-controller constants for PhysicsPlayer */

export const WALK_SPEED = 4;
export const RUN_SPEED = 7;
/** Keyboard gets snappier response than touch/gamepad damp tuning. */
export const KEYBOARD_ACCEL = 50;
export const JUMP_FORCE = 5.5;
export const GRAVITY = -15;
export const FOOTSTEP_INTERVAL = 0.4;
export const PLAYER_HEIGHT = 1.75;
export const PLAYER_RADIUS = 0.3;
export const ROTATION_SPEED = 10;

export const SKIN_WIDTH = 0.04;
export const MAX_SLOPE_CLIMB = Math.PI / 4;
export const MIN_SLOPE_SLIDE = Math.PI / 6;
export const AUTOSTEP_HEIGHT = 0.3;
export const AUTOSTEP_WIDTH = 0.2;
export const SNAP_DISTANCE = 0.15;
export const BLOCKED_RATIO = 0.35;
export const COYOTE_TIME = 0.15;
export const JUMP_COOLDOWN = 0.3;
export const TERMINAL_VELOCITY = GRAVITY * 2;
export const WARMUP_DURATION_S = 0.2;
export const KCC_FAIL_FRAMES_BEFORE_DEGRADE = 60;
export const KCC_STUCK_FRAMES_BEFORE_RECREATE = 15;
/** Cap KCC controller recreates per incident to avoid WASM churn loops. */
export const MAX_KCC_RECREATE_ATTEMPTS_PER_INCIDENT = 5;
/** Max horizontal direct-translation step when KCC is unavailable (prevents wall teleport). */
export const MAX_DIRECT_DISPLACEMENT = 0.3;
