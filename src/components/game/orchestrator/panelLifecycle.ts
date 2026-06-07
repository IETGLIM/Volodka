import type { NonNullPanelType } from './panelStackReducer';

type PanelCleanupFn = () => void;

const cleanups = new Map<NonNullPanelType, Set<PanelCleanupFn>>();

/** Register teardown for a panel id (RAF loops, timers, panel-local audio nodes). */
export function registerPanelCleanup(panelId: NonNullPanelType, fn: PanelCleanupFn): () => void {
  let set = cleanups.get(panelId);
  if (!set) {
    set = new Set();
    cleanups.set(panelId, set);
  }
  set.add(fn);
  return () => {
    set!.delete(fn);
    if (set!.size === 0) cleanups.delete(panelId);
  };
}

/** Run and clear all registered cleanups for a panel. */
export function runPanelCleanup(panelId: NonNullPanelType): void {
  const set = cleanups.get(panelId);
  if (!set) return;
  for (const fn of set) {
    try {
      fn();
    } catch (err) {
      console.warn(`[panelLifecycle] cleanup failed for ${panelId}:`, err);
    }
  }
  cleanups.delete(panelId);
}

const overlayCleanups = new Map<string, Set<PanelCleanupFn>>();

/** Register teardown for overlays (minigames, modals outside panel stack). */
export function registerOverlayCleanup(scope: string, fn: PanelCleanupFn): () => void {
  let set = overlayCleanups.get(scope);
  if (!set) {
    set = new Set();
    overlayCleanups.set(scope, set);
  }
  set.add(fn);
  return () => {
    set!.delete(fn);
    if (set!.size === 0) overlayCleanups.delete(scope);
  };
}

export function runOverlayCleanup(scope: string): void {
  const set = overlayCleanups.get(scope);
  if (!set) return;
  for (const fn of set) {
    try {
      fn();
    } catch (err) {
      console.warn(`[panelLifecycle] overlay cleanup failed for ${scope}:`, err);
    }
  }
  overlayCleanups.delete(scope);
}
