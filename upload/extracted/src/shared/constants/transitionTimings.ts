/* ─── Volodka RPG – Shared Transition Timing Constants ─── */
/* Centralized timing config for scene transitions and cinematic effects.
 * All components that depend on transition durations should reference these
 * constants instead of hardcoding magic numbers. */

/** Cinematic transition phase durations (in seconds) */
export const CINEMATIC_PHASES = {
  /** Glitch(0.15s) + wipe-in(0.35s) */
  FADE_OUT_DURATION: 0.5,
  /** Hold/black phase */
  HOLD_DURATION: 0.3,
  /** Wipe-out / fade-in phase */
  FADE_IN_DURATION: 0.4,
} as const;

/** Scene transition handler timings (in milliseconds) */
export const SCENE_TRANSITION = {
  /** Delay before playing door close sound */
  DOOR_CLOSE_DELAY_MS: 350,
  /** Total guard time before resetting transitioning flag.
   *  Should match: FADE_OUT + HOLD + FADE_IN + buffer */
  GUARD_RESET_MS: 1200,
} as const;

/** Camera shake effect timings */
export const CAMERA_SHAKE = {
  /** Duration of camera shake in milliseconds */
  DURATION_MS: 400,
  /** Default shake intensity for scene transitions */
  TRANSITION_INTENSITY: 0.08,
} as const;

/** Cutscene overlay timings (in milliseconds) */
export const CUTSCENE_TIMINGS = {
  /** Buffer after text duration for camera animation to complete */
  CAMERA_BUFFER_MS: 2000,
  /** Delay before showing skip button (prevents accidental skips) */
  SKIP_DELAY_MS: 1000,
  /** Delay before showing text overlay (let fade-to-black start first) */
  OVERLAY_DELAY_MS: 800,
  /** Fallback canvas first-frame timeout */
  CANVAS_TIMEOUT_MS: 1000,
} as const;
