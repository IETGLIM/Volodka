/// <reference types="vite/client" />

// Custom global window properties used by the profiling system.
interface Window {
  __VOL_PROFILE__?: unknown;
  /** Last sprint speed tracked by playerFinalizeFrame for hard-brake detection. */
  __lastSprintSpeed?: number;
}
