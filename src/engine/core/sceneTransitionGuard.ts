/** Scene transition re-entrance flag — isolated to break combatStartGate ↔ SceneTransitionManager cycle. */

let transitionInProgress = false;

export function isSceneTransitionInProgress(): boolean {
  return transitionInProgress;
}

export function setSceneTransitionInProgress(value: boolean): void {
  transitionInProgress = value;
}

export function resetSceneTransitionGuard(): void {
  transitionInProgress = false;
}
