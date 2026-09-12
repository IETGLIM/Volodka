/**
 * Coordinates GLB preload pauses while UI overlays (examine panel, story VN) are open.
 * Keeps main-thread headroom for input + rendering during interaction.
 */

import {
  pauseGltfPreloadForUiOverlay,
  resumeGltfPreloadForUiOverlay,
} from '@/engine/assets/gltfPreloadScheduler';

let examineOverlayOpen = false;
let storyOverlayOpen = false;
let preloadHeld = false;

/* FIX (v4.22): реактивный слой — HUD-виджеты ([E]-промпт, кроссхейр-промпт,
 * подсказки) скрываются, пока открыт оверлей осмотра/сюжета. Раньше флаг
 * был доступен только императивно, из-за чего подсказки продолжали висеть
 * над открытой панелью осмотра (стопка тултипов внизу экрана). */
type OverlayGateListener = () => void;
const overlayGateListeners = new Set<OverlayGateListener>();

function notifyOverlayGateListeners(): void {
  for (const listener of overlayGateListeners) listener();
}

/** Подписка useSyncExternalStore на изменения оверлей-гейта. */
export function subscribeOverlayGate(listener: OverlayGateListener): () => void {
  overlayGateListeners.add(listener);
  return () => {
    overlayGateListeners.delete(listener);
  };
}

export function isExamineOverlayOpen(): boolean {
  return examineOverlayOpen;
}

export function isUiOverlayBlockingDeferredAssets(): boolean {
  return examineOverlayOpen || storyOverlayOpen;
}

function syncOverlayPreloadHold(): void {
  const shouldHold = isUiOverlayBlockingDeferredAssets();
  if (shouldHold === preloadHeld) return;
  preloadHeld = shouldHold;
  if (shouldHold) {
    pauseGltfPreloadForUiOverlay();
    return;
  }
  resumeGltfPreloadForUiOverlay();
}

export function setExamineOverlayAssetGate(open: boolean): void {
  if (examineOverlayOpen === open) return;
  examineOverlayOpen = open;
  syncOverlayPreloadHold();
  notifyOverlayGateListeners();
}

export function setStoryOverlayAssetGate(open: boolean): void {
  if (storyOverlayOpen === open) return;
  storyOverlayOpen = open;
  syncOverlayPreloadHold();
  notifyOverlayGateListeners();
}

/** Test-only reset */
export function resetGltfPreloadOverlayGateForTests(): void {
  examineOverlayOpen = false;
  storyOverlayOpen = false;
  preloadHeld = false;
  notifyOverlayGateListeners();
}
