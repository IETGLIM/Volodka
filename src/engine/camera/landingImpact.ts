/* ─── Volodka RPG – Landing FOV Dip ───
 *  Brief inward FOV pinch on hard landings — reads as physical weight
 *  (the camera "thuds") without nausea. Pairs with the existing landing
 *  camera shake + footstep audio for a multi-channel impact cue.
 *
 *  Consume pattern: explorationStrategy subtracts `consumeLandingFovDip(delta)`
 *  degrees from its targetFov each frame; the dip decays exponentially.
 *
 *  Safety: purely additive to the FOV target. Does not touch the FOV spring,
 *  RUN_FOV_BOOST, scene FOV, or any physics/Rapier invariant. Gated on
 *  reduced-motion (skipped entirely when the user prefers reduced motion).
 */

import { isEffectiveReducedMotion } from '@/engine/accessibility/accessibilitySettings';

/** Max FOV dip (degrees) at full landing impact (|vel.y| = 12 m/s). */
const LANDING_FOV_DIP_DEG = 5.85; // GOD x∞ x∞ APOCALYPSE RAMP м? хм, и: bigger cinematic inward smash, apocalyptic weight + black hole crush
/** Exponential recovery speed (1/s). ~0.25s to 37%, ~0.5s to 14%. */
const LANDING_FOV_RECOVER_SPEED = 2.25; // slower recovery for even heavier cinematic feel, lingering god-crush + time dilation

let landingFovDip = 0;

/** Trigger a landing FOV dip proportional to impact strength (0..1). */
export function triggerLandingFovDip(impactStrength: number): void {
  if (impactStrength <= 0) return;
  if (isEffectiveReducedMotion()) return;
  const target = Math.min(1, Math.max(0, impactStrength)) * LANDING_FOV_DIP_DEG;
  // Take the stronger of the residual dip and the new one — a rapid double-landing
  // (e.g. hopping down stairs) should not cancel an in-flight dip, it should refresh it.
  if (target > landingFovDip) {
    landingFovDip = target;
  }
}

/** Return the current dip (degrees) and decay it toward 0 over `delta` seconds. */
export function consumeLandingFovDip(delta: number): number {
  if (landingFovDip <= 0) return 0;
  const dt = Math.min(Math.max(delta, 0), 0.1);
  landingFovDip = landingFovDip * Math.exp(-LANDING_FOV_RECOVER_SPEED * dt);
  if (landingFovDip < 0.001) landingFovDip = 0;
  return landingFovDip;
}

/** Test/helper — reset the dip (used on scene transitions / cutscene entry). */
export function resetLandingFovDip(): void {
  landingFovDip = 0;
}
