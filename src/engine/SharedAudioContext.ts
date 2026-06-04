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

/**
 * Get the shared AudioContext, creating it lazily if needed.
 * Must be called from a user gesture handler (click, keydown, touchstart).
 * Returns null in SSR or if AudioContext is not available.
 */
export function getSharedAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  if (!sharedCtx) {
    try {
      sharedCtx = new AudioContext({ latencyHint: 'interactive' });
    } catch {
      return null;
    }
  }

  return sharedCtx;
}

/**
 * Resume the shared AudioContext. Returns the promise so callers can
 * catch and ignore autoplay policy errors gracefully.
 * Only actually resumes if user has interacted (browser policy).
 */
export function safeResume(): Promise<void> {
  if (!sharedCtx) return Promise.resolve();
  if (!_userInteracted) return Promise.resolve();
  if (sharedCtx.state === 'suspended') {
    return sharedCtx.resume().catch(() => {});
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
