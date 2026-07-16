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
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

function clearWatchdog(): void {
  if (watchdogTimer) {
    clearTimeout(watchdogTimer);
    watchdogTimer = null;
  }
}

function clearHeartbeat(): void {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

function cancelPendingLoaded(): void {
  pending = null;
  clearWatchdog();
  clearHeartbeat();
}

function abortPendingLoaded(reason: string, errorCode: string): void {
  if (!pending) return;
  const payload = pending;
  pending = null;
  clearWatchdog();
  clearHeartbeat();
  devWarn('[sceneLoadedGate] Scene load watchdog:', reason, payload);
  eventBus.emit('scene:transition_failed', {
    reason,
    targetScene: payload.sceneId,
    fromScene: payload.fromSceneId,
    errorCode,
  });
}

/**
 * Periodic heartbeat: re-invalidates the canvas every 1.5 seconds while a
 * scene load is pending. This ensures the R3F render loop gets kicked even if
 * the initial invalidate() calls fire before the new scene React tree commits.
 * Combined with the canvas:invalidate-first-frame listener in
 * CanvasFrameloopController, this creates a reliable "keep trying" mechanism.
 */
function startHeartbeat(): void {
  clearHeartbeat();
  heartbeatTimer = setInterval(() => {
    if (!pending) {
      clearHeartbeat();
      return;
    }
    try {
      invalidateCanvasFirstFrame();
    } catch {
      /* canvas module may be mid-reload */
    }
  }, 1500);
}

function armWatchdog(generation: number): void {
  clearWatchdog();
  watchdogTimer = setTimeout(() => {
    watchdogTimer = null;
    if (generation !== pendingGeneration || !pending) return;
    abortPendingLoaded(
      'canvas:first-frame watchdog timeout',
      'first_frame_timeout',
    );
  }, SCENE_LOADED_FIRST_FRAME_WATCHDOG_MS);
}

function flushPendingLoaded(generation: number): void {
  if (generation !== pendingGeneration || !pending) return;
  const payload = pending;
  pending = null;
  clearWatchdog();
  clearHeartbeat();
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
  startHeartbeat();
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