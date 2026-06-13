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
  /** Fallback canvas first-frame timeout (slow mobile / cold WASM) */
  CANVAS_TIMEOUT_MS: 2800,
  /** Black overlay fade after canvas is ready */
  CANVAS_FADE_OUT_MS: 680,
  /** Quick fade when canvas was already warm */
  CANVAS_FADE_OUT_WARM_MS: 420,
} as const;

/** Shared motion curves (Framer Motion cubic-bezier) */
export const MOTION_EASE = {
  /** Premium ease-out — mode/scene reveals */
  cinematicOut: [0.16, 1, 0.3, 1] as [number, number, number, number],
  /** Standard material ease */
  standard: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
} as const;

/** Defer heavy IBL HDR fetch until the scene has settled (frames @ 60fps) */
export const ENV_MAP_WARMUP_FRAMES = 48;

/** Canvas fade during scene transition — derived from cinematic phases. */
export const CANVAS_SCENE_FADE_MS = Math.round(
  (CINEMATIC_PHASES.FADE_OUT_DURATION + CINEMATIC_PHASES.HOLD_DURATION) * 1000,
);

/** Scene overlay phase durations (milliseconds) — used by SceneTransitionOverlay. */
export const SCENE_OVERLAY_MS = {
  GLITCH: 150,
  FLASH: 200,
  DARKEN: 400,
  RIPPLE: 500,
  DISSOLVE: 400,
  WIPE_IN: Math.round(CINEMATIC_PHASES.FADE_OUT_DURATION * 1000) - 150,
  HOLD: Math.round(CINEMATIC_PHASES.HOLD_DURATION * 1000),
  WIPE_OUT: Math.round(CINEMATIC_PHASES.FADE_IN_DURATION * 1000),
  REVEAL: Math.round(CINEMATIC_PHASES.FADE_IN_DURATION * 1000),
} as const;

/** Transition progress milestones (0–100). */
export const TRANSITION_MILESTONES = {
  started: 10,
  unloading: 30,
  entered: 70,
  loaded: 100,
} as const;

/** Panel close: keep subtree mounted through PanelWrapper exit (backdrop 200ms + panel ~320ms). */
export const PANEL_EXIT_MS = 320;

/** Boot / pipeline loading screen fade-out after stage `complete`. */
export const LOADING_EXIT_MS = 420;

/** Brief beat at `playable` (97%) before auto-dismiss overlay. */
export const LOADING_PLAYABLE_DISMISS_MS = 180;

/** Pipeline hold from `playable` to `complete` — keep in sync with LoadingPipeline. */
export const LOADING_PLAYABLE_HOLD_MS = 320;

/** Headless / slow WebGL — synthetic first-frame fallback after game mount. */
export const BOOT_FIRST_FRAME_FALLBACK_MS = LOADING_PLAYABLE_DISMISS_MS + 6000;

/** LazyPanelSlot fallback if panel does not signal exit via onExitComplete. */
export const PANEL_UNMOUNT_GRACE_MS = PANEL_EXIT_MS + 80;
