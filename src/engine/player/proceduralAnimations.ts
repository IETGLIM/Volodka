/* ─── Volodka RPG – Procedural Idle/Breathing Animations ───
 * Pure functions for subtle procedural character motion.
 * All functions take time in seconds, return values with no side effects.
 */

import { Quaternion, Vector3 } from 'three';

/* ══════════════════════════════════════════════════════════════
   BREATHING
   ══════════════════════════════════════════════════════════════ */

/** ~15 breaths per minute → frequency in Hz */
const BREATH_FREQUENCY_HZ = 15 / 60; // 0.25 Hz

/** Max vertical offset (±0.02 units) */
const BREATH_AMPLITUDE = 0.02;

/**
 * Returns a subtle Y offset simulating breathing.
 * Follows a smooth sine curve at ~15 breaths/min frequency.
 *
 * @param time - elapsed time in seconds
 * @returns Y-axis offset in world units (range: -0.02 to +0.02)
 */
export function breathingOffset(time: number): number {
  return Math.sin(time * BREATH_FREQUENCY_HZ * Math.PI * 2) * BREATH_AMPLITUDE;
}

/* ══════════════════════════════════════════════════════════════
   HEAD LOOK-AT
   ══════════════════════════════════════════════════════════════ */

/** Max angle in radians (30 degrees) */
const MAX_HEAD_ANGLE_RAD = (30 * Math.PI) / 180;

const _tmpForward = new Vector3();
const _tmpToTarget = new Vector3();
const _tmpUp = new Vector3(0, 1, 0);
const _tmpQuat = new Quaternion();

/**
 * Returns a rotation quaternion for the head looking towards a target,
 * with a limited maximum angle (default 30 degrees).
 *
 * @param headPosition - world position of the head joint
 * @param targetPosition - world position to look at
 * @param maxAngleDeg - maximum rotation angle in degrees (default 30)
 * @returns Quaternion representing the limited head rotation
 */
export function headLookAt(
  headPosition: Vector3,
  targetPosition: Vector3,
  maxAngleDeg: number = 30,
): Quaternion {
  const maxAngleRad = (maxAngleDeg * Math.PI) / 180;

  // Direction from head to target
  _tmpToTarget.subVectors(targetPosition, headPosition).normalize();

  // Assume the head's forward direction is (0, 0, -1) — standard R3F convention
  _tmpForward.set(0, 0, -1);

  // Compute the rotation needed
  const dot = _tmpForward.dot(_tmpToTarget);

  // If target is behind or at exact same direction, no rotation needed
  if (dot > 0.9999) return new Quaternion();
  if (dot < -0.9999) return new Quaternion().setFromAxisAngle(_tmpUp, Math.PI);

  // Cross product gives rotation axis
  const axis = new Vector3().crossVectors(_tmpForward, _tmpToTarget).normalize();
  const angle = Math.acos(Math.max(-1, Math.min(1, dot)));

  // Clamp to max angle
  const clampedAngle = Math.min(angle, maxAngleRad);

  return _tmpQuat.setFromAxisAngle(axis, clampedAngle);
}

/* ══════════════════════════════════════════════════════════════
   IDLE WEIGHT SHIFT
   ══════════════════════════════════════════════════════════════ */

/** Weight shift frequency — slower than breathing, ~6 shifts per minute */
const IDLE_SHIFT_FREQUENCY_HZ = 6 / 60; // 0.1 Hz

/** Max horizontal offset (±0.01 units) */
const IDLE_SHIFT_AMPLITUDE = 0.01;

/**
 * Returns a subtle horizontal (X-axis) offset simulating idle weight shifting
 * between legs. Uses a slow sine wave for natural-feeling sway.
 *
 * @param time - elapsed time in seconds
 * @returns X-axis offset in world units (range: -0.01 to +0.01)
 */
export function idleShift(time: number): number {
  return Math.sin(time * IDLE_SHIFT_FREQUENCY_HZ * Math.PI * 2) * IDLE_SHIFT_AMPLITUDE;
}
