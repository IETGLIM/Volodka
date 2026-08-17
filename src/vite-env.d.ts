/// <reference types="vite/client" />

// Custom global window properties used by the profiling system.
interface Window {
  __VOL_PROFILE__?: unknown;
}
