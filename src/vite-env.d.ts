/// <reference types="vite/client" />

// Custom global window properties used by the profiling system.
interface Window {
  __VOL_PROFILE__?: unknown;
  /** Last sprint speed tracked by playerFinalizeFrame for hard-brake detection. */
  __lastSprintSpeed?: number;
  /** Brake recovery state tracked by CesiumPlayerModel for camera pitch. */
  __brakeRecovery?: number;
}

// Chrome-only Navigator API (not in standard DOM types)
interface Navigator {
  deviceMemory?: number;
}
