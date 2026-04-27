import * as THREE from 'three';
import type { KinematicCharacterController } from '@dimforge/rapier3d-compat';
import type { PlayerControls } from '@/engine/input/playerControlsTypes';
import { PHYSICS_CONSTANTS } from './constants';

/** Nominal fixed step (~60 Hz) for callers that need a default dt. */
export const DEFAULT_PHYSICS_DT = 1 / 60;

const MAX_PHYSICS_DT = 1 / 30;
const MIN_PHYSICS_DT = 1 / 1200;

/**
 * Ограничение dt для интеграции и камеры: защита от вкладки в фоне (огромный delta) и от нуля.
 * В `useBeforePhysicsStep` предпочтительно брать **`stepWorld.timestep`** (совпадает с **`Physics timeStep`**).
 */
export function clampPhysicsTimestep(dt: number): number {
  if (!Number.isFinite(dt) || dt <= 0) return DEFAULT_PHYSICS_DT;
  return Math.min(Math.max(dt, MIN_PHYSICS_DT), MAX_PHYSICS_DT);
}

export type MutableScalarRef = { current: number };
export type MutableBoolRef = { current: boolean };

/**
 * Horizontal response toward target walk/run velocity (world XZ).
 * Разный rate: ускорение при вводе / сильнее гашение при отпускании — меньше «деревянных» стопов.
 */
const HORIZONTAL_ACCEL = 12;
const HORIZONTAL_DECEL = 18;

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
  /** Используется только при `horizontalWorldSpace === false` (танк относительно yaw). */
  moveYaw: number;
  gravityY: number;
  grounded: boolean;
  verticalVel: MutableScalarRef;
  horizVelX: MutableScalarRef;
  horizVelZ: MutableScalarRef;
  canJump: MutableBoolRef;
  isRunning: MutableBoolRef;
  /**
   * true: WASD по осям мира (+X вправо, −Z «вперёд» как у клавиш forward), без поворота от камеры/модели.
   * false: горизонталь относительно `moveYaw`.
   */
  horizontalWorldSpace?: boolean;
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
    horizontalWorldSpace = false,
  } = input;

  let moveX = 0;
  let moveZ = 0;
  if (controls.forward) moveZ -= 1;
  if (controls.backward) moveZ += 1;
  if (controls.left) moveX -= 1;
  if (controls.right) moveX += 1;

  const hasInput = moveX !== 0 || moveZ !== 0;

  const len = Math.hypot(moveX, moveZ);
  if (len > 0) {
    moveX /= len;
    moveZ /= len;
  }

  const loc = locomotionScale;
  const speed =
    (controls.run ? PHYSICS_CONSTANTS.RUN_SPEED : PHYSICS_CONSTANTS.WALK_SPEED) * loc;
  isRunning.current = controls.run;
  let targetVelX: number;
  let targetVelZ: number;
  if (horizontalWorldSpace) {
    targetVelX = moveX * speed;
    targetVelZ = moveZ * speed;
  } else {
    const sin = Math.sin(moveYaw);
    const cos = Math.cos(moveYaw);
    const rotatedX = moveX * cos - moveZ * sin;
    const rotatedZ = moveX * sin + moveZ * cos;
    targetVelX = rotatedX * speed;
    targetVelZ = rotatedZ * speed;
  }

  const rate = hasInput ? HORIZONTAL_ACCEL : HORIZONTAL_DECEL;
  const t = 1 - Math.exp(-rate * dt);
  horizVelX.current = THREE.MathUtils.lerp(horizVelX.current, targetVelX, t);
  horizVelZ.current = THREE.MathUtils.lerp(horizVelZ.current, targetVelZ, t);

  verticalVel.current += gravityY * dt;

  if (grounded && controls.jump && canJump.current) {
    verticalVel.current = PHYSICS_CONSTANTS.JUMP_FORCE * loc;
    canJump.current = false;
  }

  const maxUp = PHYSICS_CONSTANTS.MAX_UPWARD_SPEED;
  if (verticalVel.current > maxUp) {
    verticalVel.current = maxUp;
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
