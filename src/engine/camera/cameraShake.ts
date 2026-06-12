/* ─── Volodka RPG – Reusable Camera Shake System ───
 *  Module-level shake state that any system can trigger.
 *  The FollowCamera reads getCameraShakeOffset() each frame
 *  and applies it to the camera position for screen-shake effects.
 */

import { getVisualSettings } from '@/engine/visualSettings';

// Module-level shake state
let shakeIntensity = 0;
let shakeDecay = 5; // How fast shake decays (per second)

const DEFAULT_SHAKE_DECAY = 5;

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

/**
 * Trigger a camera shake with the given intensity and optional decay rate.
 * Intensity is in world-space units (0.1 = 10cm of shake offset).
 * Decay controls how fast the shake dies out (higher = faster decay).
 * Multiple triggers stack by taking the max intensity.
 * No-op when the user disabled camera shake in settings.
 */
export function triggerCameraShake(intensity: number, decay?: number): void {
  if (!getVisualSettings().cameraShakeEnabled) return;
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
 */
export function getCameraShakeOffset(dt: number): { x: number; y: number } {
  normalizeShakeState();

  if (shakeIntensity < 0.001) {
    shakeIntensity = 0;
    shakeOffsetOut.x = 0;
    shakeOffsetOut.y = 0;
    return shakeOffsetOut;
  }

  shakeOffsetOut.x = (Math.random() - 0.5) * 2 * shakeIntensity;
  shakeOffsetOut.y = (Math.random() - 0.5) * 2 * shakeIntensity;

  const safeDt = Math.max(0, finiteOr(dt, 0));
  const decayFactor = Math.exp(-shakeDecay * safeDt);
  shakeIntensity = Number.isFinite(decayFactor)
    ? shakeIntensity * decayFactor
    : 0;

  if (!Number.isFinite(shakeIntensity) || shakeIntensity < 0.001) {
    shakeIntensity = 0;
  }
  return shakeOffsetOut;
}

/**
 * Immediately stop all camera shake.
 */
export function resetCameraShake(): void {
  shakeIntensity = 0;
  shakeDecay = DEFAULT_SHAKE_DECAY;
}

/**
 * Get current shake intensity (useful for debugging).
 */
export function getCameraShakeIntensity(): number {
  return shakeIntensity;
}
