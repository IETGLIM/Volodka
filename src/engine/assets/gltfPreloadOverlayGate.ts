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
  examineOverlayOpen = open;
  syncOverlayPreloadHold();
}

export function setStoryOverlayAssetGate(open: boolean): void {
  storyOverlayOpen = open;
  syncOverlayPreloadHold();
}

/** Test-only reset */
export function resetGltfPreloadOverlayGateForTests(): void {
  examineOverlayOpen = false;
  storyOverlayOpen = false;
  preloadHeld = false;
}
