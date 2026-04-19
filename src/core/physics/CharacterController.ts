import * as THREE from 'three';
import type { KinematicCharacterController } from '@dimforge/rapier3d-compat';
import type { PlayerControls } from '@/core/input/playerControlsTypes';
import { PHYSICS_CONSTANTS } from './constants';

/** Default integration step when Rapier reports an out-of-range dt. */
export const DEFAULT_PHYSICS_DT = 1 / 60;

export function clampPhysicsTimestep(dtRaw: number): number {
  return dtRaw > 1e-6 && dtRaw < 0.25 ? dtRaw : DEFAULT_PHYSICS_DT;
}

export type MutableScalarRef = { current: number };
export type MutableBoolRef = { current: boolean };

/**
 * Horizontal acceleration toward target walk/run velocity (world XZ).
 */
const HORIZONTAL_ACCEL = 14;

/**
 * Capsule half-height (cylinder segment) and radius from room scale and base constants.
 */
export function computePlayerCapsule(roomScale: number): {
  halfH: number;
  r: number;
  capCenterY: number;
} {
  const s = roomScale;
  const r0 = PHYSICS_CONSTANTS.PLAYER_RADIUS;
  const h0 = PHYSICS_CONSTANTS.PLAYER_HEIGHT;
  const r = r0 * s;
  const halfH = (h0 / 2 - r0) * s;
  const capCenterY = halfH + r;
  return { halfH, r, capCenterY };
}

/**
 * input → intent (XZ + vertical) → delta before Rapier `computeColliderMovement`.
 * Mutates velocity refs in place (same contract as previous inline `PhysicsPlayer` block).
 */
export function integrateKinematicLocomotionDelta(input: {
  dt: number;
  controls: PlayerControls;
  locomotionScale: number;
  moveYaw: number;
  gravityY: number;
  grounded: boolean;
  verticalVel: MutableScalarRef;
  horizVelX: MutableScalarRef;
  horizVelZ: MutableScalarRef;
  canJump: MutableBoolRef;
  isRunning: MutableBoolRef;
}): { dx: number; dy: number; dz: number } {
  const {
    dt,
    controls,
    locomotionScale,
    moveYaw,
    gravityY,
    grounded,
    verticalVel,
    horizVelX,
    horizVelZ,
    canJump,
    isRunning,
  } = input;

  let moveX = 0;
  let moveZ = 0;
  if (controls.forward) moveZ -= 1;
  if (controls.backward) moveZ += 1;
  if (controls.left) moveX -= 1;
  if (controls.right) moveX += 1;

  const len = Math.hypot(moveX, moveZ);
  if (len > 0) {
    moveX /= len;
    moveZ /= len;
  }

  const loc = locomotionScale;
  const speed =
    (controls.run ? PHYSICS_CONSTANTS.RUN_SPEED : PHYSICS_CONSTANTS.WALK_SPEED) * loc;
  isRunning.current = controls.run;
  const sin = Math.sin(moveYaw);
  const cos = Math.cos(moveYaw);
  const rotatedX = moveX * cos - moveZ * sin;
  const rotatedZ = moveX * sin + moveZ * cos;
  const targetVelX = rotatedX * speed;
  const targetVelZ = rotatedZ * speed;

  const t = 1 - Math.exp(-HORIZONTAL_ACCEL * dt);
  horizVelX.current = THREE.MathUtils.lerp(horizVelX.current, targetVelX, t);
  horizVelZ.current = THREE.MathUtils.lerp(horizVelZ.current, targetVelZ, t);

  verticalVel.current += gravityY * dt;

  if (grounded && controls.jump && canJump.current) {
    verticalVel.current = PHYSICS_CONSTANTS.JUMP_FORCE * loc;
    canJump.current = false;
  }

  return {
    dx: horizVelX.current * dt,
    dy: verticalVel.current * dt,
    dz: horizVelZ.current * dt,
  };
}

/**
 * After Rapier reports grounded state, clamp vertical velocity and refresh jump buffer.
 */
export function applyGroundingAfterCharacterProbe(input: {
  grounded: boolean;
  jumpHeld: boolean;
  verticalVel: MutableScalarRef;
  canJump: MutableBoolRef;
}): void {
  const { grounded, jumpHeld, verticalVel, canJump } = input;
  if (grounded) {
    if (verticalVel.current < 0) {
      verticalVel.current = 0;
    }
    if (!jumpHeld) {
      canJump.current = true;
    }
  }
}

export type CharacterControllerWorld = {
  createCharacterController(offset: number): KinematicCharacterController;
  removeCharacterController(controller: KinematicCharacterController): void;
};

/**
 * Rapier KCC preset used in exploration (autostep, snap-to-ground, slope limit).
 */
export function createExplorationKinematicCharacterController(
  world: CharacterControllerWorld,
): KinematicCharacterController {
  const cc = world.createCharacterController(0.06);
  cc.setSlideEnabled(true);
  cc.setUp({ x: 0, y: 1, z: 0 });
  cc.enableAutostep(0.35, 0.25, false);
  cc.enableSnapToGround(0.45);
  cc.setMaxSlopeClimbAngle(Math.PI * 0.45);
  return cc;
}
