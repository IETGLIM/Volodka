/**
 * Page visibility + manual pause gate for the central frame budget.
 * Skips simulation ticks when the tab is hidden or the canvas is idle (menu/intro).
 */

let pageVisible = typeof document === 'undefined' ? true : !document.hidden;
let simulationPaused = false;
let visibilityListenerRegistered = false;

function syncPageVisibleFromDocument(): void {
  if (typeof document === 'undefined') return;
  pageVisible = !document.hidden;
}

function registerPageVisibilityListener(): void {
  if (typeof document === 'undefined' || visibilityListenerRegistered) return;
  visibilityListenerRegistered = true;
  document.addEventListener('visibilitychange', syncPageVisibleFromDocument);
}

function unregisterPageVisibilityListener(): void {
  if (typeof document === 'undefined' || !visibilityListenerRegistered) return;
  document.removeEventListener('visibilitychange', syncPageVisibleFromDocument);
  visibilityListenerRegistered = false;
}

registerPageVisibilityListener();

export function isPageVisible(): boolean {
  return pageVisible;
}

/** Manual pause (menu/intro demand frameloop). */
export function setFrameSimulationPaused(paused: boolean): void {
  simulationPaused = paused;
}

export function isFrameSimulationPaused(): boolean {
  return simulationPaused;
}

/** True when frame-budget ticks and per-frame simulation should run. */
export function isFrameSimulationActive(): boolean {
  return pageVisible && !simulationPaused;
}

/** Test-only reset */
export function resetFrameVisibilityForTests(): void {
  pageVisible = true;
  simulationPaused = false;
  syncPageVisibleFromDocument();
}

/** Tear down listener on engine dispose / HMR. */
export function disposeFrameVisibility(): void {
  unregisterPageVisibilityListener();
}

/** Re-arm after dispose (StrictMode). */
export function reviveFrameVisibility(): void {
  registerPageVisibilityListener();
  syncPageVisibleFromDocument();
}
