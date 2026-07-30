import { getPlayerExternalVelocity } from '@/engine/PlayerRigidBodyState';
import {
  GRAVITY,
  ROTATION_SPEED,
  TERMINAL_VELOCITY,
  MAX_DIRECT_DISPLACEMENT,
  MAX_HORIZONTAL_SPEED,
} from '@/engine/player/playerConstants';
import { lerpAngle, enforceFloor, clampHorizontalDisplacement } from '@/engine/player/playerMath';
import { computeKccMovementSubstepped } from '@/engine/player/physicsSubstep';
import { updateMoveBlendRef, resolveLockedLocomotionPresentation } from '@/engine/player/playerLocomotionPresentation';
import { syncResolvedMovementScratch } from '@/engine/player/playerScratchSync';
import { shouldConsumeExternalVelocity } from '@/engine/player/playerMovementContract';
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

  const consumeExternal = shouldConsumeExternalVelocity(
    scratch.lockContract,
    'kcc_locked_movement',
    external.active,
  );

  if (consumeExternal) {
    vel.x = Math.max(-MAX_HORIZONTAL_SPEED, Math.min(MAX_HORIZONTAL_SPEED, external.vx));
    vel.z = Math.max(-MAX_HORIZONTAL_SPEED, Math.min(MAX_HORIZONTAL_SPEED, external.vz));

    const hSpeed = Math.sqrt(vel.x * vel.x + vel.z * vel.z);
    if (hSpeed > 0.1) {
      // Sole body-yaw writer during Approach (InteractionSystemBridge only sets velocity).
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

  // Only apply gravity when not grounded — prevents per-frame downward
  // jitter in locked mode (cutscene/dialogue).
  const wasGrounded = deps.isGroundedRef.current;
  if (!wasGrounded) {
    vel.y += GRAVITY * dt;
    if (vel.y < TERMINAL_VELOCITY) vel.y = TERMINAL_VELOCITY;
  } else {
    // H2: Only zero small positive velocities from KCC normal resolution on
    // slopes/walls. Allow larger upward velocities (e.g. intentional jump
    // impulse still decaying) to pass through.
    if (vel.y > 0 && vel.y < 0.5) vel.y = 0;
  }

  const desiredDisp = { x: vel.x * dt, y: vel.y * dt, z: vel.z * dt };
  const posBeforeMovement = rb.translation();
  const lockedCollider = deps.capsuleColliderRef.current;
  let isGroundedNow = wasGrounded;
  if (lockedCollider && controller) {
    const { actualDisplacement: actual, isGrounded: grounded } = computeKccMovementSubstepped(
      controller,
      lockedCollider,
      rb,
      desiredDisp,
      dt,
    );
    isGroundedNow = grounded;

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
    isGroundedNow = enforceFloor(rb, vel, groundY);
    if (isGroundedNow) deps.isGroundedRef.current = true;
  }

  const presentation = resolveLockedLocomotionPresentation({
    externalActive: consumeExternal,
    vx: vel.x,
    vz: vel.z,
    gamePhase: currentMode,
  });
  deps.currentAnimRef.current = presentation.anim;
  updateMoveBlendRef(deps.moveBlendRef, presentation.moveBlendTarget, dt);

  // Single floor policy after KCC (finalize publishes livePlayerPositionRef).
  if (enforceFloor(rb, vel, groundY)) {
    deps.isGroundedRef.current = true;
    isGroundedNow = true;
  }
  const lockedSpeed = Math.sqrt(vel.x * vel.x + vel.z * vel.z);
  syncResolvedMovementScratch(deps, {
    isGroundedNow,
    onFlatGround: deps.isGroundedRef.current && vel.y <= 0.2,
    airborneIntent: vel.y > 0.2,
    isMoving: lockedSpeed > 0.12,
    running: false,
    keyboardDrivesMove: false,
    blockedByWall: false,
    prevVelY: vel.y,
  });
}
