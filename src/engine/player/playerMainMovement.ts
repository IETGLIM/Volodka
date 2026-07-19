import * as THREE from 'three';
import { setPhysicsStepMs, shouldTrackFrameTiming } from '@/engine/frame/FrameBudgetRegistry';
import { sampleHeldVirtualControls } from '@/engine/VirtualInputHold';
import { getTouchLocomotionFactor } from '@/config/scenes';
import { getGameSnapshot } from '@/engine/GameActionDispatcher';
import { resolveMovementSpeedMultiplier } from '@/shared/perks/perkModifiers';
import {
  logKccRecreateAttempt,
  notifyControlsDegraded,
  restoreKccMovementMode,
} from '@/engine/player/directMovementTelemetry';
import {
  nextKccHealthyFrameCount,
  shouldAttemptKccRecreate,
  shouldEnterKccDegraded,
  shouldRestoreKccFromHealthyFrames,
} from '@/engine/player/kccRecoveryState';
import {
  WALK_SPEED,
  RUN_SPEED,
  MAX_HORIZONTAL_SPEED,
  KEYBOARD_ACCEL,
  JUMP_FORCE,
  GRAVITY,
  ROTATION_SPEED,
  SNAP_DISTANCE,
  BLOCKED_RATIO,
  COYOTE_TIME,
  JUMP_COOLDOWN,
  TERMINAL_VELOCITY,
  KCC_FAIL_FRAMES_BEFORE_DEGRADE,
  MAX_DIRECT_DISPLACEMENT,
  VARIABLE_JUMP_FALL_MULT,
  LANDING_SHAKE_MIN_VELOCITY,
  LANDING_SHAKE_INTENSITY,
  LANDING_SHAKE_DECAY,
  WALL_BUMP_SHAKE_INTENSITY,
  WALL_BUMP_SHAKE_DECAY,
  WALL_BUMP_COOLDOWN,
} from '@/engine/player/playerConstants';
import { lerpAngle, enforceFloor, clampHorizontalDisplacement } from '@/engine/player/playerMath';
import { triggerCameraShake } from '@/engine/camera/cameraShake';
import { computeKccMovementSubstepped } from '@/engine/player/physicsSubstep';
import {
  computeSlopeLocomotionScale,
  getAccessibilityLocomotionScale,
  resolveMovementIntent,
  updateMoveBlendRef,
} from '@/engine/player/playerLocomotionPresentation';
import type { PlayerMovementDeps } from '@/engine/player/playerFrameTypes';
function applyDegradedMovement(deps: PlayerMovementDeps, onFlatGround: boolean): void {
  const scratch = deps.frameScratchRef.current;
  const rb = scratch.rb!;
  const vel = scratch.vel;
  const dt = scratch.dt;
  const groundY = scratch.groundY;

  const pos = rb.translation();
  const { dx, dz } = clampHorizontalDisplacement(vel.x * dt, vel.z * dt, MAX_DIRECT_DISPLACEMENT);

  // H1 fix: apply gravity in degraded mode so the player falls instead of floating
  // at constant velocity when the KCC fails while airborne.
  if (!onFlatGround) {
    vel.y += GRAVITY * dt;
    if (vel.y < TERMINAL_VELOCITY) vel.y = TERMINAL_VELOCITY;
  }

  const [sceneW, sceneD] = deps.config.size;
  const boundaryMargin = MAX_DIRECT_DISPLACEMENT;
  const halfW = sceneW / 2 - boundaryMargin;
  const halfD = sceneD / 2 - boundaryMargin;

  const newX = Math.max(-halfW, Math.min(halfW, pos.x + dx));
  const newZ = Math.max(-halfD, Math.min(halfD, pos.z + dz));
  const newY = onFlatGround ? pos.y : pos.y + vel.y * dt;

  rb.setTranslation({ x: newX, y: newY, z: newZ }, true);
  if (enforceFloor(rb, vel, groundY)) {
    deps.isGroundedRef.current = true;
    deps.coyoteTimerRef.current = 0;
  }
  const finalPos = rb.translation();
  deps.livePlayerPositionRef.current.set(finalPos.x, finalPos.y, finalPos.z);

  const hSpeed = Math.sqrt(vel.x * vel.x + vel.z * vel.z);
  updateMoveBlendRef(deps.moveBlendRef, hSpeed > 0.15 ? 1 : 0, dt);
}

function tryRecoverKcc(deps: PlayerMovementDeps, reason: string): boolean {
  const collider = deps.capsuleColliderRef.current;
  let controller = deps.controllerRef.current;
  if (collider && controller) return true;

  if (!shouldAttemptKccRecreate(deps.directMovementTelemetry.recreateAttemptsRef.current)) {
    return false;
  }

  logKccRecreateAttempt(deps.directMovementTelemetry, reason, {
    sceneId: deps.sceneId,
    failFrames: deps.controllerFailCountRef.current,
    stuckFrames: deps.noMovementFramesRef.current,
  });
  const recreated = deps.recreateCharacterController();
  controller = recreated ?? deps.controllerRef.current;
  deps.frameScratchRef.current.controller = controller;

  if (deps.capsuleColliderRef.current && controller) {
    deps.controllerFailCountRef.current = 0;
    if (deps.controlsDegradedRef.current) {
      restoreKccMovementMode(deps.directMovementTelemetry, { sceneId: deps.sceneId });
    }
    return true;
  }
  return false;
}

/** Main KCC movement path — returns false when degraded fallback handled the frame. */
export function runMainPlayerMovement(deps: PlayerMovementDeps): boolean {
  const scratch = deps.frameScratchRef.current;
  const rb = scratch.rb!;
  if (!rb.isValid()) return false;
  const vel = scratch.vel;
  const dt = scratch.dt;
  const tickState = scratch.tickState!;

  scratch.wasGrounded = deps.isGroundedRef.current;

  const camFwd = deps.tempCameraForward.current;
  const camRight = deps.tempCameraRight.current;
  const up = deps.tempUp.current;
  const moveDir = deps.tempMoveDir.current;

  tickState.camera.getWorldDirection(camFwd);
  camFwd.y = 0;
  if (camFwd.length() > 0.001) camFwd.normalize();
  else camFwd.set(0, 0, -1);
  camRight.crossVectors(camFwd, up).normalize();

  const keys = deps.controls.getKeys();
  const virtual = sampleHeldVirtualControls(
    deps.virtualControlsRef?.current,
    tickState.clock.elapsedTime,
    deps.virtualHoldTimesRef.current,
  );
  const intent = resolveMovementIntent({ keys, virtual });
  const {
    fwd,
    bwd,
    lft,
    rgt,
    running,
    jumping,
    keyboardDrivesMove,
    analogSpeedScale,
    isMoving,
  } = intent;

  moveDir.set(0, 0, 0);
  moveDir.addScaledVector(camFwd, fwd - bwd);
  moveDir.addScaledVector(camRight, rgt - lft);

  if (deps.moveBlendRef) {
    updateMoveBlendRef(deps.moveBlendRef, isMoving ? 1 : 0, dt);
  }
  const isOutdoor = !deps.config.hasCeiling;
  const touchScale = keyboardDrivesMove ? 1 : getTouchLocomotionFactor();
  const a11yScale = getAccessibilityLocomotionScale();
  // Perk movement speed multiplier (cyber_reflexes always, night_owl /
  // shadow_walker at night, invisible detection reduction). Read from the
  // cached game snapshot so the hot path stays O(1).
  const perkSnap = getGameSnapshot();
  const perkSpeedMult = resolveMovementSpeedMultiplier(
    perkSnap.playerState.progression?.unlockedPerks ?? [],
    { timeOfDay: perkSnap.exploration?.timeOfDay },
  );
  const speed = Math.min(
    (running ? RUN_SPEED : WALK_SPEED)
    * deps.locomotionScale
    * touchScale
    * a11yScale
    * analogSpeedScale
    * perkSpeedMult,
    MAX_HORIZONTAL_SPEED,
  );
  const moveAccel = keyboardDrivesMove ? KEYBOARD_ACCEL : deps.movementTuning.accel;
  const stopDamping = keyboardDrivesMove ? deps.movementTuning.damping * 0.55 : deps.movementTuning.damping;

  scratch.isMoving = isMoving;
  scratch.running = running;
  scratch.keyboardDrivesMove = keyboardDrivesMove;
  scratch.isOutdoor = isOutdoor;
  scratch.jumpHeld = jumping;
  scratch.justLanded = false;
  scratch.landingImpactVel = 0;

  if (isMoving) {
    moveDir.normalize();
    const targetVx = moveDir.x * speed;
    const targetVz = moveDir.z * speed;
    if (keyboardDrivesMove) {
      const k = 25; // high stiffness, nearly instant but avoids hard snap
      vel.x = THREE.MathUtils.damp(vel.x, targetVx, k, dt);
      vel.z = THREE.MathUtils.damp(vel.z, targetVz, k, dt);
    } else {
      vel.x = THREE.MathUtils.damp(vel.x, targetVx, moveAccel, dt);
      vel.z = THREE.MathUtils.damp(vel.z, targetVz, moveAccel, dt);
    }

    // Third-person rotation: character faces the MOVEMENT DIRECTION when
    // moving forward/backward. Strafe (A/D) moves sideways WITHOUT rotating
    // the body — the character keeps facing forward while stepping left/right.
    //
    // Previous logic used camYaw + π for both W and S, so the character never
    // turned around when reversing direction (pressing S after W). The model
    // would moonwalk backwards — no visible rotation, just sliding.
    //
    // New logic: targetYaw = atan2(moveDir.x, moveDir.z) — faces the actual
    // movement direction. W (forward) faces away from camera (camYaw + π),
    // S (backward) faces toward camera (camYaw). The character now turns 180°
    // when reversing direction. Strafe (A/D) still doesn't rotate the body
    // because forwardIntent ≈ 0 when only A/D are pressed.
    //
    // We compute from moveDir (which already incorporates camera direction)
    // so the yaw matches the actual on-screen movement vector. This avoids
    // the "spinning in circles" bug because strafe doesn't change moveDir's
    // forward/backward component enough to flip the yaw.
    const forwardIntent = fwd - bwd; // W = +1, S = -1, neither = 0
    if (Math.abs(forwardIntent) > 0.01) {
      // Face the movement direction. moveDir is already normalized to the
      // camera-relative horizontal movement vector.
      const targetYaw = Math.atan2(moveDir.x, moveDir.z);
      const rotT = 1 - Math.exp(-ROTATION_SPEED * dt);
      deps.livePlayerRotationRef.current = lerpAngle(
        deps.livePlayerRotationRef.current, targetYaw, rotT,
      );
    }
    // Strafe-only movement (A/D without W/S) — do not rotate. Character
    // keeps current facing and steps sideways.
  } else {
    vel.x = THREE.MathUtils.damp(vel.x, 0, stopDamping, dt);
    vel.z = THREE.MathUtils.damp(vel.z, 0, stopDamping, dt);
  }

  // PHYS-1: Sanitize velocity to prevent NaN/Infinity from propagating
  // to KCC displacement (would teleport player to infinity or crash Rapier).
  if (!Number.isFinite(vel.x)) vel.x = 0;
  if (!Number.isFinite(vel.z)) vel.z = 0;
  if (!Number.isFinite(vel.y)) vel.y = 0;
  // PHYS-5: Clamp horizontal speed after damping to prevent momentary spikes.
  const hSpeedClamp = Math.sqrt(vel.x * vel.x + vel.z * vel.z);
  if (hSpeedClamp > MAX_HORIZONTAL_SPEED) {
    const s = MAX_HORIZONTAL_SPEED / hSpeedClamp;
    vel.x *= s;
    vel.z *= s;
  }

  const wantsJump =
    jumping &&
    deps.jumpCooldownRef.current <= 0 &&
    (deps.isGroundedRef.current || deps.coyoteTimerRef.current > 0);

  const posForGroundCheck = rb.translation();
  const groundY = scratch.groundY;
  scratch.groundY = groundY;
  const floorSlack = isOutdoor ? 0.08 : 0.05;
  const nearFloor = posForGroundCheck.y <= groundY + floorSlack;

  const airborneIntent = wantsJump || vel.y > 0.2;
  scratch.airborneIntent = airborneIntent;
  scratch.floorSlack = floorSlack;

  if (wantsJump && !deps.controlsDegradedRef.current) {
    vel.y = JUMP_FORCE;
    deps.isGroundedRef.current = false;
    deps.jumpCooldownRef.current = JUMP_COOLDOWN;
    deps.coyoteTimerRef.current = 0;
  } else if (
    !airborneIntent &&
    (deps.isGroundedRef.current || (nearFloor && vel.y <= 0 && !jumping))
  ) {
    vel.y = 0;
    if (nearFloor) {
      deps.isGroundedRef.current = true;
      deps.coyoteTimerRef.current = 0;
    }
  } else {
    // Variable jump height: when ascending and jump released, apply
    // stronger gravity so short hops feel snappy while full presses
    // reach peak height.
    const gravityMult = (vel.y > 0 && !jumping) ? VARIABLE_JUMP_FALL_MULT : 1;
    vel.y += GRAVITY * gravityMult * dt;
    if (vel.y < TERMINAL_VELOCITY) vel.y = TERMINAL_VELOCITY;
  }

  const onFlatGround = (deps.isGroundedRef.current || nearFloor) && !airborneIntent;
  scratch.onFlatGround = onFlatGround;
  const desiredDisplacement = {
    x: vel.x * dt,
    y: onFlatGround ? 0 : vel.y * dt,
    z: vel.z * dt,
  };

  const _posAfterGroundEnforcement = rb.translation();
  let collider = deps.capsuleColliderRef.current;
  let controller = scratch.controller;

  if (!collider || !controller) {
    deps.controllerFailCountRef.current++;
    const recovered = tryRecoverKcc(
      deps,
      !collider ? 'collider_or_controller_missing' : 'controller_missing',
    );
    collider = deps.capsuleColliderRef.current;
    controller = deps.controllerRef.current;
    scratch.controller = controller;

    if (!recovered) {
      if (shouldEnterKccDegraded(deps.controllerFailCountRef.current, KCC_FAIL_FRAMES_BEFORE_DEGRADE)) {
        notifyControlsDegraded(deps.directMovementTelemetry, 'kcc_unavailable', {
          sceneId: deps.sceneId,
          failFrames: deps.controllerFailCountRef.current,
        });
      }
      deps.kccHealthyFramesRef.current = 0;
      applyDegradedMovement(deps, onFlatGround);
      return false;
    }
  } else if (deps.controllerFailCountRef.current > 0) {
    deps.controllerFailCountRef.current = 0;
    if (deps.controlsDegradedRef.current) {
      restoreKccMovementMode(deps.directMovementTelemetry, { sceneId: deps.sceneId });
      deps.kccHealthyFramesRef.current = 0;
    }
  }

  deps.controllerFailCountRef.current = 0;

  if (airborneIntent !== deps.snapAirborneRef.current) {
    deps.snapAirborneRef.current = airborneIntent;
    controller!.enableSnapToGround(airborneIntent ? 0 : SNAP_DISTANCE);
  }

  let physicsT0: number | undefined;
  if (shouldTrackFrameTiming()) physicsT0 = performance.now();
  const {
    actualDisplacement,
    isGrounded: isGroundedNow,
    collisionCount,
  } = computeKccMovementSubstepped(controller!, collider!, rb, desiredDisplacement, dt);
  if (shouldTrackFrameTiming()) setPhysicsStepMs(performance.now() - physicsT0!);

  scratch.isGroundedNow = isGroundedNow;

  // Save vertical velocity BEFORE zeroing so landing impact can be measured.
  const prevVelY = vel.y;
  scratch.prevVelY = prevVelY;

  const wasGrounded = scratch.wasGrounded;
  if (isGroundedNow && !airborneIntent) {
    if (!wasGrounded && prevVelY < LANDING_SHAKE_MIN_VELOCITY) {
      // Landing with significant downward speed — trigger ground-impact feedback.
      const impactStrength = Math.min(1, Math.abs(prevVelY) / 12);
      triggerCameraShake(
        LANDING_SHAKE_INTENSITY * impactStrength,
        LANDING_SHAKE_DECAY,
      );
      scratch.justLanded = true;
      scratch.landingImpactVel = prevVelY;
    }
    vel.y = 0;
    if (!wasGrounded) {
      deps.jumpCooldownRef.current = 0;
    }
    deps.isGroundedRef.current = true;
    deps.coyoteTimerRef.current = 0;
  } else if (!isGroundedNow) {
    if (wasGrounded && !isGroundedNow && vel.y <= 0) {
      deps.coyoteTimerRef.current = COYOTE_TIME;
    }
    deps.isGroundedRef.current = false;

    if (dt > 0.001) {
      const actualVy = actualDisplacement.y / dt;
      const desiredVy = vel.y;
      if (desiredVy < 0 && actualVy > desiredVy + 2.0) {
        vel.y = actualVy;
      }
      if (desiredVy > 0 && actualVy < desiredVy - 2.0) {
        vel.y = 0;
      }
    }
  }

  const desiredHLen = Math.sqrt(desiredDisplacement.x ** 2 + desiredDisplacement.z ** 2);
  const actualHLen = Math.sqrt(actualDisplacement.x ** 2 + actualDisplacement.z ** 2);
  const blockedByCollider = desiredHLen > 0.001 && actualHLen < desiredHLen * BLOCKED_RATIO;
  const blockedByWall = blockedByCollider && collisionCount > 0;
  scratch.blockedByWall = blockedByWall;

  if (blockedByWall) {
    const slideRatio = Math.max(actualHLen / Math.max(desiredHLen, 0.001), 0.15);
    vel.x *= slideRatio;
    vel.z *= slideRatio;

    // Wall bump feedback — subtle camera shake with cooldown.
    if (deps.wallBumpCooldownRef.current <= 0) {
      triggerCameraShake(WALL_BUMP_SHAKE_INTENSITY, WALL_BUMP_SHAKE_DECAY);
      deps.wallBumpCooldownRef.current = WALL_BUMP_COOLDOWN;
    }
  }
  if (deps.wallBumpCooldownRef.current > 0) {
    deps.wallBumpCooldownRef.current -= dt;
  }

  if (isGroundedNow && !airborneIntent && isMoving) {
    const slopeScale = computeSlopeLocomotionScale(
      actualDisplacement.x,
      actualDisplacement.y,
      actualDisplacement.z,
      true,
    );
    if (slopeScale < 1) {
      vel.x *= slopeScale;
      vel.z *= slopeScale;
    }
  }

  if (deps.controlsDegradedRef.current) {
    deps.kccHealthyFramesRef.current = nextKccHealthyFrameCount(
      true,
      true,
      deps.kccHealthyFramesRef.current,
    );
    if (shouldRestoreKccFromHealthyFrames(true, deps.kccHealthyFramesRef.current)) {
      restoreKccMovementMode(deps.directMovementTelemetry, { sceneId: deps.sceneId });
      deps.kccHealthyFramesRef.current = 0;
    }
  } else {
    deps.kccHealthyFramesRef.current = 0;
  }

  return true;
}
