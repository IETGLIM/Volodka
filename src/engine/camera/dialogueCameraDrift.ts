/* ─── Volodka RPG – Dialogue Camera Micro-Movements ───
 *  Subtle drift applied on top of the dialogue shot to keep the frame
 *  alive during long conversations. Disabled on reduced motion.
 *
 *  Components:
 *  - Circular position drift (radius 0.1m, period 20s) in the camera-local XZ plane.
 *  - FOV breathing (±0.5° over 8s).
 *  - Push-in on new dialogue beat (0.3m closer, 0.5° tighter FOV over 0.6s)
 *    triggered when the current story node id changes (choices appear).
 *
 *  Module-level state is intentional — the drift phase must persist across
 *  frames for the same dialogue session. Reset via resetDialogueCameraDrift()
 *  when dialogue exits.
 */

import * as THREE from 'three';
import { isEffectiveReducedMotion } from '@/engine/accessibility/accessibilitySettings';

const DRIFT_RADIUS_M = 0.1;
const DRIFT_PERIOD_SEC = 20;
const FOV_BREATHING_AMPLITUDE_DEG = 0.5;
const FOV_BREATHING_PERIOD_SEC = 8;
const CHOICE_PUSH_DISTANCE_M = 0.3;
const CHOICE_PUSH_FOV_DELTA_DEG = 0.5;
const CHOICE_PUSH_DURATION_SEC = 0.6;

let _driftTime = 0;
let _lastNodeId: string | null = null;
let _choicePushStartTime = -Infinity;

const _scratchForward = new THREE.Vector3();
const _scratchRight = new THREE.Vector3();
const _scratchUp = new THREE.Vector3(0, 1, 0);

/** Reset drift state — call when dialogue exits or scene changes. */
export function resetDialogueCameraDrift(): void {
  _driftTime = 0;
  _lastNodeId = null;
  _choicePushStartTime = -Infinity;
}

/** Returns true if drift is currently active (non-reduced-motion only). */
export function isDialogueCameraDriftActive(): boolean {
  return !isEffectiveReducedMotion();
}

/**
 * Apply drift offsets to the dialogue camera targets.
 *
 * Mutates `outPos` and `outFov` in place. `outPos` starts as a copy of
 * `basePos` (the dialogue shot's computed position); drift and push-in
 * offsets are added to it.
 *
 * @param delta Frame delta in seconds.
 * @param currentNodeId The current story node id (triggers push-in on change).
 * @param basePos The base camera position (from getBlendedDialogueShot).
 * @param baseLook The base look-at target.
 * @param baseFov The base FOV.
 * @param outPos Output: drifted camera position (pre-initialised to basePos).
 * @param outFov Output: drifted FOV.
 */
export function applyDialogueCameraDrift(
  delta: number,
  currentNodeId: string | undefined,
  basePos: THREE.Vector3,
  baseLook: THREE.Vector3,
  baseFov: number,
  outPos: THREE.Vector3,
  outFov: { value: number },
): void {
  if (isEffectiveReducedMotion()) {
    outPos.copy(basePos);
    outFov.value = baseFov;
    return;
  }

  _driftTime += delta;

  // Trigger push-in when the node changes (new dialogue beat / choices appear)
  if (currentNodeId && currentNodeId !== _lastNodeId) {
    _lastNodeId = currentNodeId;
    _choicePushStartTime = _driftTime;
  }

  // Circular drift — radius 0.1m, period 20s. Y drift is dampened (×0.3)
  // so the camera doesn't bob noticeably.
  const driftAngle = (_driftTime / DRIFT_PERIOD_SEC) * Math.PI * 2;
  const driftX = Math.cos(driftAngle) * DRIFT_RADIUS_M;
  const driftY = Math.sin(driftAngle) * DRIFT_RADIUS_M * 0.3;

  // FOV breathing — sine wave, ±0.5° over 8s.
  const fovBreath =
    Math.sin((_driftTime / FOV_BREATHING_PERIOD_SEC) * Math.PI * 2) *
    FOV_BREATHING_AMPLITUDE_DEG;

  // Choice push — easeInOutCubic over 0.6s, then hold at 1.0.
  const timeSincePush = _driftTime - _choicePushStartTime;
  let pushFactor = 0;
  if (timeSincePush >= 0 && timeSincePush < CHOICE_PUSH_DURATION_SEC) {
    const t = timeSincePush / CHOICE_PUSH_DURATION_SEC;
    pushFactor = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  } else if (timeSincePush >= CHOICE_PUSH_DURATION_SEC) {
    pushFactor = 1;
  }

  // Compute camera-local right vector (perpendicular to look direction, in XZ plane).
  _scratchForward.subVectors(baseLook, basePos);
  _scratchForward.y = 0;
  if (_scratchForward.lengthSq() < 1e-6) {
    _scratchForward.set(0, 0, 1);
  }
  _scratchForward.normalize();
  _scratchRight.crossVectors(_scratchForward, _scratchUp).normalize();

  // Apply drift to position.
  outPos.copy(basePos);
  outPos.addScaledVector(_scratchRight, driftX);
  outPos.y += driftY;

  // Apply push-in (move camera toward look target by pushFactor * distance).
  if (pushFactor > 0) {
    const pushDist = pushFactor * CHOICE_PUSH_DISTANCE_M;
    _scratchForward.subVectors(baseLook, outPos).normalize();
    outPos.addScaledVector(_scratchForward, pushDist);
  }

  outFov.value = baseFov - fovBreath - pushFactor * CHOICE_PUSH_FOV_DELTA_DEG;
}
