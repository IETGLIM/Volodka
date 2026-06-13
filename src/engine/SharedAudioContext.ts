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
 * Check if the shared AudioContext has been created and is running.
 */
export function isSharedAudioContextReady(): boolean {
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
  _pendingQueue = [];
  _userInteracted = false;
  registerGestureResumeHandlers();
}

/** Re-arm tab blur/focus hooks after dispose (React StrictMode). Idempotent. */
export function reviveSharedAudioContext(): void {
  registerGestureResumeHandlers();
  registerTabVisibilityHandlers();
}

registerHmrDispose(disposeSharedAudioContext);
