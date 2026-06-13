import * as THREE from 'three';
import { setPhysicsStepMs, shouldTrackFrameTiming } from '@/engine/frame/FrameBudgetRegistry';
import { sampleHeldVirtualControls } from '@/engine/VirtualInputHold';
import { getTouchLocomotionFactor } from '@/config/scenes';
import {
  logKccRecreateAttempt,
  notifyControlsDegraded,
  restoreKccMovementMode,
} from '@/engine/player/directMovementTelemetry';
import {
  WALK_SPEED,
  RUN_SPEED,
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
} from '@/engine/player/playerConstants';
import { lerpAngle, enforceFloor } from '@/engine/player/playerMath';
import { computeKccMovementSubstepped } from '@/engine/player/physicsSubstep';
import type { PlayerMovementDeps } from '@/engine/player/playerFrameTypes';

function applyDegradedMovement(deps: PlayerMovementDeps, onFlatGround: boolean): void {
  const scratch = deps.frameScratchRef.current;
  const rb = scratch.rb!;
  const vel = scratch.vel;
  const dt = scratch.dt;
  const groundY = scratch.groundY;

  vel.x = 0;
  vel.z = 0;

  const pos = rb.translation();
  const newY = onFlatGround ? pos.y : pos.y + vel.y * dt;
  rb.setTranslation({ x: pos.x, y: newY, z: pos.z }, true);
  if (enforceFloor(rb, vel, groundY)) {
    deps.isGroundedRef.current = true;
    deps.coyoteTimerRef.current = 0;
  }
  const finalPos = rb.translation();
  deps.livePlayerPositionRef.current.set(finalPos.x, finalPos.y, finalPos.z);
}

function tryRecoverKcc(deps: PlayerMovementDeps, reason: string): boolean {
  const collider = deps.capsuleColliderRef.current;
  let controller = deps.controllerRef.current;
  if (collider && controller) return true;

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
  const keyboardDrivesMove = keys.hasMovement;
  const mergeVirtual = !keyboardDrivesMove;

  const fwd = (keys.forward ? 1 : 0) + (mergeVirtual ? (virtual?.forward ?? 0) : 0);
  const bwd = (keys.backward ? 1 : 0) + (mergeVirtual ? (virtual?.backward ?? 0) : 0);
  const lft = (keys.left ? 1 : 0) + (mergeVirtual ? (virtual?.left ?? 0) : 0);
  const rgt = (keys.right ? 1 : 0) + (mergeVirtual ? (virtual?.right ?? 0) : 0);
  const running = keys.run || (virtual?.run ?? 0) > 0;
  const jumping = keys.jump || (virtual?.jump ?? 0) > 0;

  moveDir.set(0, 0, 0);
  moveDir.addScaledVector(camFwd, fwd - bwd);
  moveDir.addScaledVector(camRight, rgt - lft);

  const moveLen = moveDir.length();
  const isMoving = moveLen > 0.01;
  if (deps.moveBlendRef) {
    deps.moveBlendRef.current = THREE.MathUtils.damp(
      deps.moveBlendRef.current,
      isMoving ? 1 : 0,
      8,
      dt,
    );
  }
  const isOutdoor = !deps.config.hasCeiling;
  const touchScale = keyboardDrivesMove ? 1 : getTouchLocomotionFactor();
  const speed = (running ? RUN_SPEED : WALK_SPEED) * deps.locomotionScale * touchScale;
  const moveAccel = keyboardDrivesMove ? KEYBOARD_ACCEL : deps.movementTuning.accel;
  const stopDamping = keyboardDrivesMove ? deps.movementTuning.damping * 0.55 : deps.movementTuning.damping;

  scratch.isMoving = isMoving;
  scratch.running = running;
  scratch.keyboardDrivesMove = keyboardDrivesMove;
  scratch.isOutdoor = isOutdoor;

  if (isMoving && !deps.controlsDegradedRef.current) {
    moveDir.normalize();
    const targetVx = moveDir.x * speed;
    const targetVz = moveDir.z * speed;
    if (keyboardDrivesMove) {
      const kbAccel = moveAccel * 1.35;
      vel.x = THREE.MathUtils.damp(vel.x, targetVx, kbAccel, dt);
      vel.z = THREE.MathUtils.damp(vel.z, targetVz, kbAccel, dt);
    } else {
      vel.x = THREE.MathUtils.damp(vel.x, targetVx, moveAccel, dt);
      vel.z = THREE.MathUtils.damp(vel.z, targetVz, moveAccel, dt);
    }

    const targetYaw = Math.atan2(moveDir.x, moveDir.z);
    const rotT = 1 - Math.exp(-ROTATION_SPEED * dt);
    deps.livePlayerRotationRef.current = lerpAngle(
      deps.livePlayerRotationRef.current, targetYaw, rotT,
    );
  } else if (!deps.controlsDegradedRef.current) {
    vel.x = THREE.MathUtils.damp(vel.x, 0, stopDamping, dt);
    vel.z = THREE.MathUtils.damp(vel.z, 0, stopDamping, dt);
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
    vel.y += GRAVITY * dt;
    if (vel.y < TERMINAL_VELOCITY) vel.y = TERMINAL_VELOCITY;
  }

  const onFlatGround = (deps.isGroundedRef.current || nearFloor) && !airborneIntent;
  scratch.onFlatGround = onFlatGround;
  const desiredDisplacement = {
    x: vel.x * dt,
    y: onFlatGround ? 0 : vel.y * dt,
    z: vel.z * dt,
  };

  const posAfterGroundEnforcement = rb.translation();
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
      if (deps.controllerFailCountRef.current >= KCC_FAIL_FRAMES_BEFORE_DEGRADE) {
        notifyControlsDegraded(deps.directMovementTelemetry, 'kcc_unavailable', {
          sceneId: deps.sceneId,
          failFrames: deps.controllerFailCountRef.current,
        });
      }
      applyDegradedMovement(deps, onFlatGround);
      return false;
    }
  } else if (deps.controllerFailCountRef.current > 0) {
    deps.controllerFailCountRef.current = 0;
    if (deps.controlsDegradedRef.current) {
      restoreKccMovementMode(deps.directMovementTelemetry, { sceneId: deps.sceneId });
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

  const wasGrounded = scratch.wasGrounded;
  if (isGroundedNow && !airborneIntent) {
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

  if (blockedByCollider && desiredHLen > 0.001 && actualHLen < desiredHLen * BLOCKED_RATIO) {
    const slideRatio = Math.max(actualHLen / desiredHLen, 0.15);
    vel.x *= slideRatio;
    vel.z *= slideRatio;
  }

  return true;
}

