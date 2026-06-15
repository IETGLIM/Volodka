/** Scene transition flags — sync guard for re-entrancy; async guard until scene:loaded. */

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

/** @deprecated Use setSyncSceneTransitionInProgress — kept for existing call sites. */
export function setSceneTransitionInProgress(value: boolean): void {
  setSyncSceneTransitionInProgress(value);
}

export function resetSceneTransitionGuard(): void {
  syncTransitionInProgress = false;
  asyncTransitionInProgress = false;
}
