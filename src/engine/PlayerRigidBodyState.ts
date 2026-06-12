/* ─── Volodka RPG – Shared player rigid body ref + external velocity ─── */

/**
 * Module-level ref that PhysicsPlayer writes its RigidBody into.
 * InteractionSystemBridge reads from this to manipulate player velocity
 * during the Approach/Align/Lock phases.
 *
 * With kinematicPosition RigidBody, InteractionSystemBridge can't use
 * setLinvel() directly. Instead, it sets externalVelocity, which
 * PhysicsPlayer incorporates into the KinematicCharacterController
 * displacement computation. This ensures ALL movement goes through
 * the character controller's collision resolution — even during
 * interaction approach/align phases.
 */

import type { RapierRigidBody } from '@react-three/rapier';

let playerRigidBody: RapierRigidBody | null = null;

/** Set by PhysicsPlayer on mount */
export function setPlayerRigidBody(rb: RapierRigidBody): void {
  playerRigidBody = rb;
}

/** Read by InteractionSystemBridge every frame */
export function getPlayerRigidBody(): RapierRigidBody | null {
  return playerRigidBody;
}

/**
 * Check whether a RapierRigidBody is still valid (not disposed).
 *
 * When a RigidBody is removed from the physics world (e.g. during scene
 * transitions), its isValid() method returns false. Calling methods like
 * .linvel(), .translation(), or .setLinvel() on a disposed body will throw.
 *
 * NOTE: The old check using `raw.alive` was wrong — @dimforge/rapier3d-compat
 * does NOT expose a `raw` property on RigidBody. The correct API is isValid().
 */
export function isPlayerRigidBodyValid(rb: RapierRigidBody | null): boolean {
  if (!rb) return false;
  try {
    return rb.isValid();
  } catch {
    return false;
  }
}

/* ─── External velocity control ─── */

/**
 * External velocity intent from InteractionSystemBridge.
 * PhysicsPlayer reads this every frame and incorporates it into
 * the KinematicCharacterController displacement, so collision
 * resolution works even during approach/align phases.
 */
let externalVelX = 0;
let externalVelZ = 0;
let externalActive = false;

/** Stable snapshot reused by getPlayerExternalVelocity (no per-frame alloc). */
const externalVelocitySample = {
  vx: 0,
  vz: 0,
  active: false,
};

export type PlayerExternalVelocity = typeof externalVelocitySample;

/** Set external horizontal velocity (called by InteractionSystemBridge) */
export function setPlayerExternalVelocity(vx: number, vz: number): void {
  externalVelX = vx;
  externalVelZ = vz;
  externalActive = true;
}

/** Clear external velocity — return control to player input */
export function clearPlayerExternalVelocity(): void {
  externalVelX = 0;
  externalVelZ = 0;
  externalActive = false;
}

/** Read external velocity (called by PhysicsPlayer each frame) */
export function getPlayerExternalVelocity(): PlayerExternalVelocity {
  externalVelocitySample.vx = externalVelX;
  externalVelocitySample.vz = externalVelZ;
  externalVelocitySample.active = externalActive;
  return externalVelocitySample;
}

/** Clear the player rigid body reference — called on PhysicsPlayer unmount */
export function clearPlayerRigidBody(): void {
  playerRigidBody = null;
}
