/**
 * Defers scene:loaded until the WebGL canvas composits its first frame after
 * scene:enter. Subscribers (transition overlay, e2e, combat flush) expect the
 * new scene React tree to have rendered at least once — not merely committed
 * to the store while Suspense chunks are still streaming.
 */

import { eventBus } from '@/engine/EventBus';
import {
  hasRegisteredCanvas,
  invalidateCanvasFirstFrame,
} from '@/engine/canvas/canvasFirstFrameSession';
import type { SceneId } from '@/shared/types/game';

export type SceneLoadedPayload = { sceneId: SceneId; fromSceneId: SceneId };

let pending: SceneLoadedPayload | null = null;
let pendingGeneration = 0;
let unsubCanvasFirstFrame: (() => void) | null = null;

function flushPendingLoaded(generation: number): void {
  if (generation !== pendingGeneration || !pending) return;
  const payload = pending;
  pending = null;
  eventBus.emit('scene:loaded', payload);
}

/** Queue scene:loaded for the next canvas:first-frame after scene:enter. */
export function scheduleSceneLoaded(payload: SceneLoadedPayload): void {
  pending = payload;
  pendingGeneration += 1;
  const generation = pendingGeneration;

  if (!hasRegisteredCanvas()) {
    // Test harness / headless — no canvas to wait on.
    queueMicrotask(() => flushPendingLoaded(generation));
    return;
  }

  invalidateCanvasFirstFrame();
}

/** (Re)bind canvas:first-frame → scene:loaded bridge after EventBus dispose/revive. */
export function bindSceneLoadedBridge(): void {
  unsubCanvasFirstFrame?.();
  unsubCanvasFirstFrame = eventBus.on('canvas:first-frame', () => {
    flushPendingLoaded(pendingGeneration);
  });
}

export function ensureSceneLoadedBridge(): void {
  bindSceneLoadedBridge();
}

/** Test harness — reset pending latch between cases. */
export function resetSceneLoadedGate(): void {
  pending = null;
  pendingGeneration = 0;
  unsubCanvasFirstFrame?.();
  unsubCanvasFirstFrame = null;
}
