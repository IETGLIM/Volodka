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
export function safeResume(): Promise<void> {
  if (!sharedCtx) return Promise.resolve();
  if (sharedCtx.state === 'suspended') {
    return sharedCtx.resume().then(() => {
      // Flush pending sound queue
      const queue = _pendingQueue;
      _pendingQueue = [];
      queue.forEach(fn => { try { fn(); } catch {} });
    }).catch(() => {});
  }
  return Promise.resolve();
}

// ── Browser autoplay policy: resume AudioContext on first user gesture ──
if (typeof window !== 'undefined') {
  const resumeOnce = () => {
    _userInteracted = true;
    if (sharedCtx && sharedCtx.state === 'suspended') {
      sharedCtx.resume().catch(() => {});
    }
  };
  window.addEventListener('click', resumeOnce, { once: true });
  window.addEventListener('keydown', resumeOnce, { once: true });
  window.addEventListener('touchstart', resumeOnce, { once: true });
}

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
if (typeof window !== 'undefined') {
  window.addEventListener('blur', suspendSharedAudioContext);
  window.addEventListener('focus', resumeSharedAudioContext);
}
