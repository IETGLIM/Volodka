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
import { SCENE_LOADED_FIRST_FRAME_WATCHDOG_MS } from '@/shared/constants/transitionTimings';
import type { SceneId } from '@/shared/types/game';
import { devWarn } from '@/shared/utils/devLog';

export type SceneLoadedPayload = { sceneId: SceneId; fromSceneId: SceneId };

let pending: SceneLoadedPayload | null = null;
let pendingGeneration = 0;
let bridgeUnsubs: Array<() => void> | null = null;
let watchdogTimer: ReturnType<typeof setTimeout> | null = null;

function clearWatchdog(): void {
  if (watchdogTimer) {
    clearTimeout(watchdogTimer);
    watchdogTimer = null;
  }
}

function cancelPendingLoaded(): void {
  pending = null;
  clearWatchdog();
}

function abortPendingLoaded(reason: string, errorCode: string): void {
  if (!pending) return;
  const payload = pending;
  pending = null;
  clearWatchdog();
  devWarn('[sceneLoadedGate] Scene load watchdog:', reason, payload);
  eventBus.emit('scene:transition_failed', {
    reason,
    targetScene: payload.sceneId,
    fromScene: payload.fromSceneId,
    errorCode,
  });
}

/** FIX P0 #5: When the canvas:first-frame watchdog fires, the scene React tree
 *  has already committed (scene:enter emitted, store updated). The only thing
 *  missing is the GPU composite — and on slow devices that can take a few
 *  seconds longer than our 8s budget. Rather than failing the transition and
 *  leaving the player stuck on the overlay, we soft-flush `scene:loaded` so
 *  the transition overlay closes and gameplay HUDs attach. If the WebGL
 *  context is genuinely broken, Canvas3DErrorBoundary will surface a retry
 *  button separately — we don't need to be the failure path here. */
function softFlushPendingLoaded(reason: string): void {
  if (!pending) return;
  const payload = pending;
  pending = null;
  clearWatchdog();
  devWarn('[sceneLoadedGate] Watchdog fired — soft-flushing scene:loaded:', reason, payload);
  eventBus.emit('scene:loaded', payload);
}

function armWatchdog(generation: number): void {
  clearWatchdog();
  watchdogTimer = setTimeout(() => {
    watchdogTimer = null;
    if (generation !== pendingGeneration || !pending) return;
    // FIX P0 #5: soft-flush instead of abort — see softFlushPendingLoaded.
    softFlushPendingLoaded('canvas:first-frame watchdog timeout');
  }, SCENE_LOADED_FIRST_FRAME_WATCHDOG_MS);
}

function flushPendingLoaded(generation: number): void {
  if (generation !== pendingGeneration || !pending) return;
  const payload = pending;
  pending = null;
  clearWatchdog();
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
  armWatchdog(generation);
}

function clearBridgeListeners(): void {
  if (!bridgeUnsubs) return;
  for (const unsub of bridgeUnsubs) unsub();
  bridgeUnsubs = null;
}

/** (Re)bind canvas:first-frame → scene:loaded bridge after EventBus dispose/revive. */
export function bindSceneLoadedBridge(): void {
  clearBridgeListeners();
  bridgeUnsubs = [
    eventBus.on('canvas:first-frame', () => {
      flushPendingLoaded(pendingGeneration);
    }),
    eventBus.on('canvas:context-lost', () => {
      abortPendingLoaded('WebGL context lost', 'webgl_context_lost');
    }),
    eventBus.on('scene:transition_failed', () => {
      cancelPendingLoaded();
    }),
  ];
}

export function ensureSceneLoadedBridge(): void {
  bindSceneLoadedBridge();
}

/** Test harness — reset pending latch between cases. */
export function resetSceneLoadedGate(): void {
  cancelPendingLoaded();
  pendingGeneration = 0;
  clearBridgeListeners();
}
