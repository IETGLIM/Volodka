import { getPlayerExternalVelocity } from '@/engine/PlayerRigidBodyState';
import {
  GRAVITY,
  ROTATION_SPEED,
  TERMINAL_VELOCITY,
  MAX_DIRECT_DISPLACEMENT,
} from '@/engine/player/playerConstants';
import { lerpAngle, enforceFloor, clampHorizontalDisplacement } from '@/engine/player/playerMath';
import { computeKccMovementSubstepped } from '@/engine/player/physicsSubstep';
import { updateMoveBlendRef } from '@/engine/player/playerLocomotionPresentation';
import type { PlayerMovementDeps } from '@/engine/player/playerFrameTypes';

/** Locked branch — combat anim, external velocity, KCC/direct when interaction holds movement. */
export function runLockedPlayerMovement(deps: PlayerMovementDeps): void {
  const scratch = deps.frameScratchRef.current;
  const rb = scratch.rb!;
  const controller = scratch.controller!;
  if (!rb.isValid()) return;
  const vel = scratch.vel;
  const groundY = scratch.groundY;
  const dt = scratch.dt;
  const currentMode = scratch.currentMode;

  const external = getPlayerExternalVelocity();

  if (external.active) {
    vel.x = external.vx;
    vel.z = external.vz;

    const hSpeed = Math.sqrt(vel.x * vel.x + vel.z * vel.z);
    if (hSpeed > 0.1) {
      const targetYaw = Math.atan2(vel.x, vel.z);
      const rotT = 1 - Math.exp(-ROTATION_SPEED * dt);
      deps.livePlayerRotationRef.current = lerpAngle(
        deps.livePlayerRotationRef.current, targetYaw, rotT,
      );
    }
  } else {
    vel.x = 0;
    vel.z = 0;
  }

  vel.y += GRAVITY * dt;
  if (vel.y < TERMINAL_VELOCITY) vel.y = TERMINAL_VELOCITY;

  if (enforceFloor(rb, vel, groundY)) {
    deps.isGroundedRef.current = true;
  }

  const desiredDisp = { x: vel.x * dt, y: vel.y * dt, z: vel.z * dt };
  const posBeforeMovement = rb.translation();
  const lockedCollider = deps.capsuleColliderRef.current;
  if (lockedCollider && controller) {
    const { actualDisplacement: actual, isGrounded: grounded } = computeKccMovementSubstepped(
      controller,
      lockedCollider,
      rb,
      desiredDisp,
      dt,
    );

    if (grounded) {
      vel.y = 0;
      deps.isGroundedRef.current = true;
    } else {
      if (dt > 0.001) {
        const actualVy = actual.y / dt;
        if (vel.y < 0 && actualVy > vel.y + 2.0) vel.y = actualVy;
        if (vel.y > 0 && actualVy < vel.y - 2.0) vel.y = 0;
      }
      deps.isGroundedRef.current = false;
    }
  } else {
    const { dx, dz } = clampHorizontalDisplacement(
      desiredDisp.x,
      desiredDisp.z,
      MAX_DIRECT_DISPLACEMENT,
    );
    rb.setTranslation({
      x: posBeforeMovement.x + dx,
      y: posBeforeMovement.y + desiredDisp.y,
      z: posBeforeMovement.z + dz,
    }, true);
  }

  if (currentMode === 'combat') {
    deps.currentAnimRef.current = 'combat';
  } else {
    deps.currentAnimRef.current = 'idle';
  }

  const hSpeed = Math.sqrt(vel.x * vel.x + vel.z * vel.z);
  updateMoveBlendRef(deps.moveBlendRef, hSpeed > 0.15 ? 1 : 0, dt);

  if (enforceFloor(rb, vel, groundY)) {
    deps.isGroundedRef.current = true;
  }
  const pos = rb.translation();
  deps.livePlayerPositionRef.current.set(pos.x, pos.y, pos.z);
}
