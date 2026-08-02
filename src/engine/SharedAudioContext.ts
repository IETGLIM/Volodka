/* ─── Volodka RPG – Shared AudioContext provider ─── */

/**
 * P1-3.5 FIX: Single shared AudioContext for both AudioEngine and MusicEngine.
 *
 * Problem: AudioEngine and MusicEngine each created their own AudioContext.
 * Most browsers limit the number of simultaneous AudioContexts (Chrome: 6).
 * Two contexts can't share nodes (e.g., ConvolverNode for reverb).
 *
 * Solution: This module provides a lazily-created singleton AudioContext
 * that both engines share. Created on first access (requires user gesture).
 * Tab blur/focus handlers for suspend/resume are managed centrally.
 */

import { registerHmrDispose } from '@/shared/dev/hmrDispose';
import { probeAudioCapabilities, resetAudioCapabilitiesCache } from '@/engine/audio/audioCapabilities';
import { clearReverbImpulseCache } from '@/engine/audio/AudioEngineCore';

let sharedCtx: AudioContext | null = null;
let _userInteracted = false;
/** Queue of callbacks to run once AudioContext is resumed */
let _pendingQueue: Array<() => void> = [];

/**
 * Get the shared AudioContext, creating it lazily if needed.
 * The context is created in suspended state — it will be resumed
 * on the first user gesture (click/keydown/touchstart).
 */
export function getSharedAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  if (!sharedCtx) {
    try {
      sharedCtx = new AudioContext({ latencyHint: 'interactive' });
      probeAudioCapabilities(sharedCtx);
      // Immediately suspend to satisfy browser policy, then attempt resume
      if (sharedCtx.state === 'running') {
        sharedCtx.suspend().catch(() => {});
      }
    } catch {
      return null;
    }
  }

  return sharedCtx;
}

/**
 * Queue a callback to run once AudioContext is running.
 * Use this to defer all sound playback until user gesture.
 */
export function whenAudioReady(fn: () => void): void {
  if (isSharedAudioContextReady()) {
    fn();
  } else {
    _pendingQueue.push(fn);
  }
}

/**
 * Resume the shared AudioContext. Always attempts resume — browser
 * will reject if no user gesture, which we catch silently.
 */
function flushPendingAudioQueue(): void {
  const queue = _pendingQueue;
  _pendingQueue = [];
  for (const fn of queue) {
    try {
      fn();
    } catch {
      // ignore playback errors during queue flush
    }
  }
}

export function safeResume(): Promise<void> {
  if (!sharedCtx) return Promise.resolve();
  if (sharedCtx.state === 'suspended') {
    return sharedCtx.resume().then(() => {
      flushPendingAudioQueue();
    }).catch(() => {});
  }
  flushPendingAudioQueue();
  return Promise.resolve();
}

const resumeOnce = () => {
  _userInteracted = true;
  void safeResume();
};

function registerGestureResumeHandlers(): void {
  if (typeof window === 'undefined') return;
  window.addEventListener('click', resumeOnce, { once: true });
  window.addEventListener('keydown', resumeOnce, { once: true });
  window.addEventListener('touchstart', resumeOnce, { once: true });
}

let tabVisibilityHandlersRegistered = false;

function registerTabVisibilityHandlers(): void {
  if (typeof window === 'undefined' || tabVisibilityHandlersRegistered) return;
  window.addEventListener('blur', suspendSharedAudioContext);
  window.addEventListener('focus', resumeSharedAudioContext);
  tabVisibilityHandlersRegistered = true;
}

function unregisterTabVisibilityHandlers(): void {
  if (typeof window === 'undefined' || !tabVisibilityHandlersRegistered) return;
  window.removeEventListener('blur', suspendSharedAudioContext);
  window.removeEventListener('focus', resumeSharedAudioContext);
  tabVisibilityHandlersRegistered = false;
}

// ── Browser autoplay policy: resume AudioContext on first user gesture ──
registerGestureResumeHandlers();
registerTabVisibilityHandlers();

/**
 * Check if the shared AudioContext has been created and is running,
 * OR if the user has interacted (gestures registered) — in which case
 * the context will be resumed on the next playFootstep/playSfx call.
 *
 * Previously this returned false until sharedCtx.state === 'running',
 * which meant if the user clicked before any audio system called
 * getSharedAudioContext(), the context was never created and all
 * whenAudioReady callbacks piled up in _pendingQueue forever —
 * footsteps never played.
 *
 * Now: if the user has interacted, we treat the context as ready
 * (it will be lazily created + resumed in initContext()).
 */
export function isSharedAudioContextReady(): boolean {
  if (_userInteracted) return true;
  return sharedCtx !== null && sharedCtx.state === 'running';
}

/**
 * Suspend the shared AudioContext (called on tab blur).
 */
export function suspendSharedAudioContext(): void {
  if (sharedCtx && sharedCtx.state === 'running') {
    sharedCtx.suspend().catch(() => {});
  }
}

/**
 * Resume the shared AudioContext (called on tab focus).
 */
export function resumeSharedAudioContext(): void {
  if (sharedCtx && sharedCtx.state === 'suspended') {
    sharedCtx.resume().catch(() => {});
  }
}

// Tab blur/focus handlers — managed centrally for both engines
registerTabVisibilityHandlers();

/** Close shared AudioContext and drop tab blur/focus hooks (unmount / HMR). */
export function disposeSharedAudioContext(): void {
  unregisterTabVisibilityHandlers();
  if (sharedCtx) {
    sharedCtx.close().catch(() => {});
    sharedCtx = null;
  }
  resetAudioCapabilitiesCache();
  clearReverbImpulseCache();
  _pendingQueue = [];
  _userInteracted = false;
  resetListenerCache();
  registerGestureResumeHandlers();
}

/** Re-arm tab blur/focus hooks after dispose (React StrictMode). Idempotent. */
export function reviveSharedAudioContext(): void {
  registerGestureResumeHandlers();
  registerTabVisibilityHandlers();
}

/* ─── AudioListener spatial tracking ───
 * The Web Audio AudioListener is the "ears" of the scene — PannerNode sources
 * are mixed relative to its position + orientation. Default position is
 * [0,0,0] facing -Z, which means every spatial source in the world renders
 * without any sense of player movement. The camera frame tick calls these
 * setters so the listener tracks the player's head.
 *
 * Throttled internally: skips updates where the listener moved < 0.1m since
 * the last applied position (sub-threshold motion is inaudible at game scale).
 */

/** Last applied listener position (NaN before first call). */
let _listenerLastX = NaN;
let _listenerLastY = NaN;
let _listenerLastZ = NaN;
/** Squared threshold (0.1m)² — below this, skip the AudioParam write. */
const LISTENER_MIN_DELTA_SQ = 0.1 * 0.1;
/** setTargetAtTime time constant — ~50ms smoothing to avoid zipper noise. */
const LISTENER_RAMP_TAU = 0.05;

/**
 * Set the AudioListener's world position. Safe to call when the context is
 * not yet created (no-op). Uses the modern `positionX/Y/Z` AudioParams when
 * available, falling back to the deprecated `setPosition(x,y,z)` for older
 * browsers (Safari < 14, legacy Edge).
 */
export function setListenerPosition(x: number, y: number, z: number): void {
  const ctx = sharedCtx;
  if (!ctx) return;
  const listener = ctx.listener;
  if (!listener) return;

  // Throttle: skip sub-threshold motion to reduce AudioParam write overhead.
  if (Number.isFinite(_listenerLastX)) {
    const dx = x - _listenerLastX;
    const dy = y - _listenerLastY;
    const dz = z - _listenerLastZ;
    if (dx * dx + dy * dy + dz * dz < LISTENER_MIN_DELTA_SQ) return;
  }
  _listenerLastX = x;
  _listenerLastY = y;
  _listenerLastZ = z;

  const now = ctx.currentTime;
  // Modern API (AudioParam) — preferred, supports smoothing.
  // The deprecated setPosition is gone from modern TS lib.dom.d.ts, so cast
  // through a minimal local interface to avoid `any`.
  const modern = listener as AudioListener & {
    positionX?: AudioParam;
    positionY?: AudioParam;
    positionZ?: AudioParam;
  };
  if (modern.positionX && modern.positionY && modern.positionZ) {
    try {
      modern.positionX.setTargetAtTime(x, now, LISTENER_RAMP_TAU);
      modern.positionY.setTargetAtTime(y, now, LISTENER_RAMP_TAU);
      modern.positionZ.setTargetAtTime(z, now, LISTENER_RAMP_TAU);
    } catch {
      /* AudioParam may be invalidated mid-stop */
    }
    return;
  }
  const legacy = listener as unknown as {
    setPosition?: (x: number, y: number, z: number) => void;
  };
  try {
    legacy.setPosition?.(x, y, z);
  } catch {
    /* legacy listener may not support setPosition */
  }
}

/**
 * Set the AudioListener's orientation (forward + up vectors). The camera
 * frame tick derives forward from `camera.getWorldDirection()` and uses the
 * world-up [0,1,0] (matching the renderer's Y-up convention).
 */
export function setListenerOrientation(
  forwardX: number, forwardY: number, forwardZ: number,
  upX: number, upY: number, upZ: number,
): void {
  const ctx = sharedCtx;
  if (!ctx) return;
  const listener = ctx.listener;
  if (!listener) return;

  const now = ctx.currentTime;
  const modern = listener as AudioListener & {
    forwardX?: AudioParam;
    forwardY?: AudioParam;
    forwardZ?: AudioParam;
    upX?: AudioParam;
    upY?: AudioParam;
    upZ?: AudioParam;
  };
  if (modern.forwardX && modern.forwardY && modern.forwardZ
      && modern.upX && modern.upY && modern.upZ) {
    try {
      modern.forwardX.setTargetAtTime(forwardX, now, LISTENER_RAMP_TAU);
      modern.forwardY.setTargetAtTime(forwardY, now, LISTENER_RAMP_TAU);
      modern.forwardZ.setTargetAtTime(forwardZ, now, LISTENER_RAMP_TAU);
      modern.upX.setTargetAtTime(upX, now, LISTENER_RAMP_TAU);
      modern.upY.setTargetAtTime(upY, now, LISTENER_RAMP_TAU);
      modern.upZ.setTargetAtTime(upZ, now, LISTENER_RAMP_TAU);
    } catch {
      /* AudioParam may be invalidated mid-stop */
    }
    return;
  }
  const legacy = listener as unknown as {
    setOrientation?: (fx: number, fy: number, fz: number, ux: number, uy: number, uz: number) => void;
  };
  try {
    legacy.setOrientation?.(forwardX, forwardY, forwardZ, upX, upY, upZ);
  } catch {
    /* legacy listener may not support setOrientation */
  }
}

/** Reset cached listener position (called from dispose so a fresh context
 *  doesn't inherit the previous throttle gate). */
function resetListenerCache(): void {
  _listenerLastX = NaN;
  _listenerLastY = NaN;
  _listenerLastZ = NaN;
}

registerHmrDispose(disposeSharedAudioContext);
