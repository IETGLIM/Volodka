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
const DEFAULT_COYOTE_TIME_SEC = 0.08;
const DEFAULT_JUMP_BUFFER_TIME_SEC = 0.1;
const DEFAULT_JUMP_CUT_MIN_HOLD_SEC = 0.05;
const DEFAULT_JUMP_CUT_MULTIPLIER = 0.5;

export type MovementModifiers = {
  accelerationScale?: number;
  speedScale?: number;
  frictionOverride?: number;
  gravityScale?: number;
};

/**
 * Capsule half-height (cylinder segment) and radius from room scale and base constants.
 */
export function computePlayerCapsule(
  roomScale: number,
  visualModelScale?: number,
): {
  halfH: number;
  r: number;
  capCenterY: number;
} {
  const s = roomScale;
  const visualScaleFactor =
    visualModelScale && Number.isFinite(visualModelScale) && visualModelScale > 0
      ? THREE.MathUtils.clamp(visualModelScale / Math.max(0.001, roomScale), 0.75, 1.4)
      : 1;
  const r0 = PHYSICS_CONSTANTS.PLAYER_RADIUS;
  const h0 = PHYSICS_CONSTANTS.PLAYER_HEIGHT;
  const r = r0 * s * visualScaleFactor;
  const halfH = (h0 / 2 - r0) * s * visualScaleFactor;
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
  coyoteTimer?: MutableScalarRef;
  jumpBufferTimer?: MutableScalarRef;
  jumpHeldTime?: MutableScalarRef;
  movementModifiers?: MovementModifiers;
  capsuleRadius?: number;
  coyoteTimeSec?: number;
  jumpBufferTimeSec?: number;
  jumpCutMinHoldSec?: number;
  jumpCutMultiplier?: number;
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
    coyoteTimer,
    jumpBufferTimer,
    jumpHeldTime,
    movementModifiers,
    capsuleRadius,
    coyoteTimeSec = DEFAULT_COYOTE_TIME_SEC,
    jumpBufferTimeSec = DEFAULT_JUMP_BUFFER_TIME_SEC,
    jumpCutMinHoldSec = DEFAULT_JUMP_CUT_MIN_HOLD_SEC,
    jumpCutMultiplier = DEFAULT_JUMP_CUT_MULTIPLIER,
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

  // `locomotionScale` — канонический сценовый масштаб темпа (walk/run/jump одновременно),
  // `speedScale` — локальный модификатор только для горизонтали (бафы/дебафы, поверхности и т.п.).
  const loc = locomotionScale;
  const speedScale = movementModifiers?.speedScale ?? 1;
  const speed =
    (controls.run ? PHYSICS_CONSTANTS.RUN_SPEED : PHYSICS_CONSTANTS.WALK_SPEED) * loc * speedScale;
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

  const accelScale = movementModifiers?.accelerationScale ?? 1;
  const frictionOverride = movementModifiers?.frictionOverride;
  const decelScale = frictionOverride ?? accelScale;
  const rate = hasInput ? HORIZONTAL_ACCEL * accelScale : HORIZONTAL_DECEL * decelScale;
  const t = 1 - Math.exp(-rate * dt);
  horizVelX.current = THREE.MathUtils.lerp(horizVelX.current, targetVelX, t);
  horizVelZ.current = THREE.MathUtils.lerp(horizVelZ.current, targetVelZ, t);

  const gravityScale = movementModifiers?.gravityScale ?? 1;
  verticalVel.current += gravityY * gravityScale * dt;

  const coyote = coyoteTimer?.current ?? 0;
  if (!grounded && coyoteTimer) {
    coyoteTimer.current = Math.max(0, coyote - dt);
  }

  if (controls.jump) {
    if (jumpBufferTimer) {
      jumpBufferTimer.current = jumpBufferTimeSec;
    }
  } else if (jumpBufferTimer) {
    jumpBufferTimer.current = Math.max(0, jumpBufferTimer.current - dt);
  }

  const bufferedJump = (jumpBufferTimer?.current ?? 0) > 0;
  const canUseCoyote = grounded || coyote > 0;
  if (canUseCoyote && (controls.jump || bufferedJump) && canJump.current) {
    verticalVel.current = PHYSICS_CONSTANTS.JUMP_FORCE * loc;
    canJump.current = false;
    if (coyoteTimer) coyoteTimer.current = 0;
    if (jumpBufferTimer) jumpBufferTimer.current = 0;
    if (jumpHeldTime) jumpHeldTime.current = 0;
  } else if (!controls.jump && verticalVel.current > 0 && jumpHeldTime) {
    if (jumpHeldTime.current >= jumpCutMinHoldSec) {
      verticalVel.current *= jumpCutMultiplier;
      jumpHeldTime.current = 0;
    }
  }

  if (controls.jump && verticalVel.current > 0 && jumpHeldTime) {
    jumpHeldTime.current += dt;
  } else if ((!controls.jump || verticalVel.current <= 0) && jumpHeldTime) {
    jumpHeldTime.current = 0;
  }

  const maxUp = PHYSICS_CONSTANTS.MAX_UPWARD_SPEED;
  if (verticalVel.current > maxUp) {
    verticalVel.current = maxUp;
  }

  let dx = horizVelX.current * dt;
  let dy = verticalVel.current * dt;
  let dz = horizVelZ.current * dt;
  if (capsuleRadius && Number.isFinite(capsuleRadius) && capsuleRadius > 0) {
    const maxMove = capsuleRadius * 0.8;
    const moveLen = Math.hypot(dx, dy, dz);
    if (moveLen > maxMove && moveLen > 1e-8) {
      const s = maxMove / moveLen;
      dx *= s;
      dy *= s;
      dz *= s;
    }
  }

  return { dx, dy, dz };
}

/**
 * After Rapier reports grounded state, clamp vertical velocity and refresh jump buffer.
 */
export function applyGroundingAfterCharacterProbe(input: {
  grounded: boolean;
  jumpHeld: boolean;
  verticalVel: MutableScalarRef;
  canJump: MutableBoolRef;
  coyoteTimer?: MutableScalarRef;
  jumpBufferTimer?: MutableScalarRef;
  jumpHeldTime?: MutableScalarRef;
  horizVelX?: MutableScalarRef;
  horizVelZ?: MutableScalarRef;
  surfaceFriction?: number;
  coyoteTimeSec?: number;
}): void {
  const {
    grounded,
    jumpHeld,
    verticalVel,
    canJump,
    coyoteTimer,
    jumpBufferTimer,
    jumpHeldTime,
    horizVelX,
    horizVelZ,
    surfaceFriction,
    coyoteTimeSec = DEFAULT_COYOTE_TIME_SEC,
  } = input;
  if (grounded) {
    if (coyoteTimer) coyoteTimer.current = coyoteTimeSec;
    if (verticalVel.current < 0) {
      verticalVel.current = 0;
    }
    if (jumpHeldTime) {
      jumpHeldTime.current = 0;
    }
    if (!jumpHeld) {
      canJump.current = true;
    }
    if (surfaceFriction != null && Number.isFinite(surfaceFriction) && horizVelX && horizVelZ) {
      const keep = Math.min(Math.max(surfaceFriction, 0), 1);
      horizVelX.current *= keep;
      horizVelZ.current *= keep;
    }
  } else if (coyoteTimer) {
    coyoteTimer.current = Math.max(0, coyoteTimer.current);
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
  roomScale = 1,
): KinematicCharacterController {
  const cc = world.createCharacterController(0.06);
  cc.setSlideEnabled(true);
  cc.setUp({ x: 0, y: 1, z: 0 });
  const s = Math.max(0.28, Math.min(1.25, roomScale));
  cc.enableAutostep(0.35 * s, 0.25 * s, false);
  cc.enableSnapToGround(0.45 * s);
  cc.setMaxSlopeClimbAngle(Math.PI * 0.45);
  return cc;
}
