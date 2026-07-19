/* ─── Volodka RPG – Reusable Camera Shake System ───
 *  Module-level shake state that any system can trigger.
 *  The FollowCamera reads getCameraShakeOffset() each frame
 *  and applies it to the camera position for screen-shake effects.
 */

import { isEffectiveReducedMotion } from '@/engine/accessibility/accessibilitySettings';
import { getVisualSettings } from '@/engine/visualSettings';
import { eventBus } from '@/engine/EventBus';
import { registerHmrDispose } from '@/shared/dev/hmrDispose';

// Module-level shake state
let shakeIntensity = 0;
let shakeDecay = 5; // How fast shake decays (per second)

const DEFAULT_SHAKE_DECAY = 5;

// CAM-2: Frame-id guard — prevent double-decay if getCameraShakeOffset
// is called multiple times per frame (e.g., from multiple useFrame hooks).
let _lastShakeFrameId = -1;
let _lastShakeFrameOffset = { x: 0, y: 0 };

function finiteOr(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

function normalizeShakeState(): void {
  if (!Number.isFinite(shakeIntensity) || shakeIntensity < 0) {
    shakeIntensity = 0;
  }
  if (!Number.isFinite(shakeDecay) || shakeDecay <= 0) {
    shakeDecay = DEFAULT_SHAKE_DECAY;
  }
}

/** Reused each frame — avoid allocating { x, y } per call. */
const shakeOffsetOut = { x: 0, y: 0 };

/** Helper: cache the current shake offset for the frame-id guard. */
function cacheAndReturnOffset(): { x: number; y: number } {
  _lastShakeFrameOffset.x = shakeOffsetOut.x;
  _lastShakeFrameOffset.y = shakeOffsetOut.y;
  return shakeOffsetOut;
}

/* ── Landing settle: smooth damped return after shake ends ── */
let _settleActive = false;
let _settleX = 0;
let _settleY = 0;
/** Decay speed for settle phase — e^(-5 * 0.5) ≈ 0.08, so ~92% reduced in 0.5s. */
const SETTLE_SPEED = 5;

/**
 * Trigger a camera shake with the given intensity and optional decay rate.
 * Intensity is in world-space units (0.1 = 10cm of shake offset).
 * Decay controls how fast the shake dies out (higher = faster decay).
 * Multiple triggers stack by taking the max intensity.
 * No-op when the user disabled camera shake in settings.
 */
export function triggerCameraShake(intensity: number, decay?: number): void {
  if (!getVisualSettings().cameraShakeEnabled || isEffectiveReducedMotion()) return;
  normalizeShakeState();

  const safeIntensity = finiteOr(intensity, 0);
  if (safeIntensity <= 0) return;

  shakeIntensity = Math.max(shakeIntensity, safeIntensity);
  if (decay !== undefined) {
    const safeDecay = finiteOr(decay, DEFAULT_SHAKE_DECAY);
    if (safeDecay > 0) shakeDecay = safeDecay;
  }
}

/**
 * Get the current frame's shake offset and advance the decay.
 * Call once per frame from the camera update loop.
 * Returns { x, y } offset to add to camera position.
 *
 * CAM-2: Includes a timestamp-based guard — if called multiple times
 * within the same ~4ms window (one frame at 240Hz), returns the cached
 * offset without re-decaying, preventing shake from decaying N× faster.
 */
export function getCameraShakeOffset(dt: number): { x: number; y: number } {
  const now = performance.now();

  // If called again within 4ms of the last call (same frame), return cached.
  if (now - _lastShakeFrameId < 4) {
    return _lastShakeFrameOffset;
  }
  _lastShakeFrameId = now;

  normalizeShakeState();
  const safeDt = Math.max(0, finiteOr(dt, 0));

  // ── Settle phase: damped spring return after shake ends ──
  if (_settleActive) {
    const settleDecay = Math.exp(-SETTLE_SPEED * safeDt);
    _settleX *= settleDecay;
    _settleY *= settleDecay;
    shakeOffsetOut.x = _settleX;
    shakeOffsetOut.y = _settleY;
    if (Math.abs(_settleX) < 0.0001 && Math.abs(_settleY) < 0.0001) {
      _settleActive = false;
      shakeOffsetOut.x = 0;
      shakeOffsetOut.y = 0;
    }
    // New shake trigger interrupts settle
    if (shakeIntensity >= 0.001) _settleActive = false;
    else return cacheAndReturnOffset();
  }

  if (shakeIntensity < 0.001) {
    shakeIntensity = 0;
    // Enter settle phase from last offset instead of snapping to zero
    if (shakeOffsetOut.x !== 0 || shakeOffsetOut.y !== 0) {
      _settleActive = true;
      _settleX = shakeOffsetOut.x;
      _settleY = shakeOffsetOut.y;
      return cacheAndReturnOffset();
    }
    shakeOffsetOut.x = 0;
    shakeOffsetOut.y = 0;
    return cacheAndReturnOffset();
  }

  shakeOffsetOut.x = (Math.random() - 0.5) * 2 * shakeIntensity;
  shakeOffsetOut.y = (Math.random() - 0.5) * 2 * shakeIntensity;

  const decayFactor = Math.exp(-shakeDecay * safeDt);
  shakeIntensity = Number.isFinite(decayFactor)
    ? shakeIntensity * decayFactor
    : 0;

  if (!Number.isFinite(shakeIntensity) || shakeIntensity < 0.001) {
    shakeIntensity = 0;
  }
  return cacheAndReturnOffset();
}

/**
 * Immediately stop all camera shake.
 */
export function resetCameraShake(): void {
  shakeIntensity = 0;
  shakeDecay = DEFAULT_SHAKE_DECAY;
  _settleActive = false;
  _settleX = 0;
  _settleY = 0;
  _lastShakeFrameId = -1;
  _lastShakeFrameOffset.x = 0;
  _lastShakeFrameOffset.y = 0;
}

/**
 * Get current shake intensity (useful for debugging).
 */
export function getCameraShakeIntensity(): number {
  return shakeIntensity;
}

// ── Global listener: cutscene-triggered camera shake ──
// Wire the cutscene:camera_shake event so any cinematic system
// (timeline runner, NPC cutscene launcher, story-node effects, etc.) can
// trigger shake without directly importing this module.
//
// Supports two payload shapes:
//   { intensity, frequency }  — frequency is the decay rate (per second)
//   { intensity, duration }   — duration (ms) is converted to a decay rate
//                               that brings intensity to ~1% by the end
//                               (decay ≈ 4.6 / (duration / 1000)).
// When both are provided, frequency wins (backward compat).
const _cutsceneShakeListener = (payload: {
  intensity: number;
  frequency?: number;
  duration?: number;
}): void => {
  const { intensity, frequency, duration } = payload;
  if (frequency !== undefined) {
    triggerCameraShake(intensity, frequency);
    return;
  }
  if (duration !== undefined && duration > 0) {
    // decay such that exp(-decay * duration_sec) ≈ 0.01
    const decay = 4.6 / (duration / 1000);
    triggerCameraShake(intensity, decay);
    return;
  }
  triggerCameraShake(intensity);
};

let _unsubCutsceneShake: (() => void) | null = eventBus.on(
  'cutscene:camera_shake',
  _cutsceneShakeListener,
);

// Area D: register HMR dispose so the module-level listener is cleaned up
// before the module re-loads and re-binds. Without this, HMR would leave
// the old listener attached until eventBus.resetForHmr() runs (which clears
// ALL listeners, including ones from other modules that may have already
// re-bound). Explicit disposal is safer and matches interactionSession.ts.
registerHmrDispose(() => {
  if (_unsubCutsceneShake) {
    _unsubCutsceneShake();
    _unsubCutsceneShake = null;
  }
  resetCameraShake();
});
