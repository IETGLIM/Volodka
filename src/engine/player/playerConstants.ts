/** Locomotion and character-controller constants for PhysicsPlayer */

export const WALK_SPEED = 4;
export const RUN_SPEED = 7;
/** Keyboard gets snappier response than touch/gamepad damp tuning. */
export const KEYBOARD_ACCEL = 50;
export const JUMP_FORCE = 5.5;
export const GRAVITY = -15;
export const FOOTSTEP_INTERVAL = 0.4;
export const PLAYER_HEIGHT = 1.75;
/**
 * [roadmap:PLYR-01] Reduced from 0.30 to 0.25 — adult human shoulders ≈ 0.45m
 * diameter → radius 0.22-0.25. 0.30 felt "fat" through doorways. 0.25 keeps
 * the player from clipping door frames while still fitting through standard
 * 0.9m door openings with margin.
 */
export const PLAYER_RADIUS = 0.25;
export const ROTATION_SPEED = 10;

export const SKIN_WIDTH = 0.04;
export const MAX_SLOPE_CLIMB = Math.PI / 4;
export const MIN_SLOPE_SLIDE = Math.PI / 6;
export const AUTOSTEP_HEIGHT = 0.3;
export const AUTOSTEP_WIDTH = 0.2;
/**
 * [roadmap:PLYR-02] Increased from 0.15 to 0.22 — at 7 m/s run speed, a frame
 * step is ~0.117m. 0.15m snap was barely larger than one frame step, causing
 * the capsule to briefly leave the ground on small bumps at high speed.
 * 0.22m gives ~2 frames of tolerance at 60fps (Valve L4D uses ~0.25m).
 */
export const SNAP_DISTANCE = 0.22;
export const BLOCKED_RATIO = 0.35;
export const COYOTE_TIME = 0.15;
export const JUMP_COOLDOWN = 0.3;
/**
 * [roadmap:PLYR-07] Jump buffer window — if the player presses jump within
 * this many seconds BEFORE landing, the jump fires immediately on landing.
 * Standard since ~2010 (e.g., Valve L4D, Hollow Knight, Celeste). Without
 * buffering, a jump press 50ms before landing is lost — feels unresponsive.
 * 0.15s matches COYOTE_TIME for symmetry (forgiveness window both ways).
 */
export const JUMP_BUFFER_TIME = 0.15;
export const TERMINAL_VELOCITY = GRAVITY * 2;
export const WARMUP_DURATION_S = 0.2;
export const KCC_FAIL_FRAMES_BEFORE_DEGRADE = 60;
export const KCC_STUCK_FRAMES_BEFORE_RECREATE = 15;
/** Cap KCC controller recreates per incident to avoid WASM churn loops. */
export const MAX_KCC_RECREATE_ATTEMPTS_PER_INCIDENT = 5;
/** Max horizontal direct-translation step when KCC is unavailable (prevents wall teleport). */
export const MAX_DIRECT_DISPLACEMENT = 0.3;
