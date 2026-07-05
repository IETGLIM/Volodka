/**
 * Scene transition flags — sync guard for re-entrancy; async guard until
 * scene:loaded.
 *
 * [roadmap:ARCH-09] Removed `@deprecated setSceneTransitionInProgress` alias.
 * All call sites now use `setSyncSceneTransitionInProgress` directly.
 */

let syncTransitionInProgress = false;
let asyncTransitionInProgress = false;

/** True while a transition is in flight (sync body or awaiting scene:loaded). */
export function isSceneTransitionInProgress(): boolean {
  return syncTransitionInProgress || asyncTransitionInProgress;
}

/** Re-entrancy guard — only the synchronous performSceneTransition body. */
export function isSyncSceneTransitionInProgress(): boolean {
  return syncTransitionInProgress;
}

export function setSyncSceneTransitionInProgress(value: boolean): void {
  syncTransitionInProgress = value;
}

export function setAsyncSceneTransitionInProgress(value: boolean): void {
  asyncTransitionInProgress = value;
}

export function resetSceneTransitionGuard(): void {
  syncTransitionInProgress = false;
  asyncTransitionInProgress = false;
}
