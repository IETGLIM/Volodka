/* ─── Volodka RPG – Reusable Camera Shake System ───
 *  Module-level shake state that any system can trigger.
 *  The FollowCamera reads getCameraShakeOffset() each frame
 *  and applies it to the camera position for screen-shake effects.
 */

import { getVisualSettings } from '@/engine/visualSettings';

// Module-level shake state
let shakeIntensity = 0;
let shakeDecay = 5; // How fast shake decays (per second)

/**
 * Trigger a camera shake with the given intensity and optional decay rate.
 * Intensity is in world-space units (0.1 = 10cm of shake offset).
 * Decay controls how fast the shake dies out (higher = faster decay).
 * Multiple triggers stack by taking the max intensity.
 * No-op when the user disabled camera shake in settings.
 */
export function triggerCameraShake(intensity: number, decay?: number): void {
  if (!getVisualSettings().cameraShakeEnabled) return;
  shakeIntensity = Math.max(shakeIntensity, intensity);
  if (decay !== undefined) shakeDecay = decay;
}

/**
 * Get the current frame's shake offset and advance the decay.
 * Call once per frame from the camera update loop.
 * Returns { x, y } offset to add to camera position.
 */
export function getCameraShakeOffset(dt: number): { x: number; y: number } {
  if (shakeIntensity < 0.001) return { x: 0, y: 0 };
  const x = (Math.random() - 0.5) * 2 * shakeIntensity;
  const y = (Math.random() - 0.5) * 2 * shakeIntensity;
  shakeIntensity *= Math.exp(-shakeDecay * dt);
  if (shakeIntensity < 0.001) shakeIntensity = 0;
  return { x, y };
}

/**
 * Immediately stop all camera shake.
 */
export function resetCameraShake(): void {
  shakeIntensity = 0;
}

/**
 * Get current shake intensity (useful for debugging).
 */
export function getCameraShakeIntensity(): number {
  return shakeIntensity;
}
