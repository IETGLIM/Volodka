/** Locomotion and character-controller constants for PhysicsPlayer */

export const WALK_SPEED = 4;
export const RUN_SPEED = 7;
/** Absolute cap on horizontal speed (m/s). Prevents perk stacking or
 *  external velocity injection from producing extreme speeds. */
export const MAX_HORIZONTAL_SPEED = 15;
/** Keyboard gets snappier response than touch/gamepad damp tuning. */
export const KEYBOARD_ACCEL = 55;
export const JUMP_FORCE = 5.5;
export const GRAVITY = -15;
export const FOOTSTEP_INTERVAL = 0.4;
export const PLAYER_HEIGHT = 1.75;
export const PLAYER_RADIUS = 0.3;
export const ROTATION_SPEED = 8.5;
/** Speed for 180-degree direction reversals — slower than normal rotation
 *  so the character appears to physically turn around rather than snapping.
 *  GTA/Gothic-style games use 4–5 for reversal turns. */
export const ROTATION_SPEED_REVERSAL = 5.0;
/** Angle threshold (radians) above which a direction reversal turn is used.
 *  ~120° — mid camera-relative redirects stay snappy; only hard about-faces slow. */
export const ROTATION_REVERSAL_THRESHOLD = (Math.PI * 2) / 3;

export const SKIN_WIDTH = 0.04;
export const MAX_SLOPE_CLIMB = Math.PI / 4;
export const MIN_SLOPE_SLIDE = Math.PI / 6;
export const AUTOSTEP_HEIGHT = 0.42;
export const AUTOSTEP_WIDTH = 0.24;
export const SNAP_DISTANCE = 0.2;
export const BLOCKED_RATIO = 0.35;
export const COYOTE_TIME = 0.18;
export const JUMP_COOLDOWN = 0.3;
export const TERMINAL_VELOCITY = GRAVITY * 1.5; // -22.5 m/s — safe for substep budget
export const WARMUP_DURATION_S = 0.2;
export const KCC_FAIL_FRAMES_BEFORE_DEGRADE = 60;
export const KCC_STUCK_FRAMES_BEFORE_RECREATE = 15;

// ── Ground feel & feedback ──
/** Minimum downward velocity (m/s) to trigger landing camera shake. */
export const LANDING_SHAKE_MIN_VELOCITY = -4;
/** Camera shake intensity on hard landing (world-space units). */
export const LANDING_SHAKE_INTENSITY = 0.04;
/** How fast landing shake decays (higher = faster). */
export const LANDING_SHAKE_DECAY = 5;
/** Very subtle camera shake when walking into a wall. */
export const WALL_BUMP_SHAKE_INTENSITY = 0.012;
/** How fast wall-bump shake decays. */
export const WALL_BUMP_SHAKE_DECAY = 8;
/** Maximum wall-bump shake cooldown to prevent rapid re-trigger. */
export const WALL_BUMP_COOLDOWN = 0.3;

// ── Variable jump height ──
/** Gravity multiplier when ascending with jump button released (makes short hops feel snappy). */
export const VARIABLE_JUMP_FALL_MULT = 2.2;

// ── Running FOV boost ──
/** Additional FOV degrees when sprinting (adds peripheral speed feel). */
export const RUN_FOV_BOOST = 3;
/** Player speed (m/s) at which FOV boost is at full intensity. */
export const RUN_FOV_SPEED_FULL = 5.5;
/** Player speed (m/s) at which FOV boost begins. */
export const RUN_FOV_SPEED_MIN = 2.5;
/** Cap KCC controller recreates per incident to avoid WASM churn loops. */
export const MAX_KCC_RECREATE_ATTEMPTS_PER_INCIDENT = 5;
/** Max horizontal direct-translation step when KCC is unavailable (prevents wall teleport). */
export const MAX_DIRECT_DISPLACEMENT = 0.3;
/** Distance (m) at which NPC proximity prompt becomes visible. */
export const NPC_INTERACTION_RANGE = 3.0;
/** Query range used by interaction targeting + HUD ring fallback (slightly wider than prompt). */
export const NPC_INTERACTION_QUERY_RANGE = 3.5;
/** Fraction of maxRange under which the target is considered “in interact range” for scoring/UI. */
export const INTERACTION_IN_RANGE_FRACTION = 0.6;
