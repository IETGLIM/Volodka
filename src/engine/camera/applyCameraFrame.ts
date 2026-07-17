import * as THREE from 'three';
import {
  updateSpringCamera,
  applyEnhancedBreathingIdle,
  resetDialogueShotController,
  setGlobalTimeScale,
} from './cinematicCamera';
import { canWriteCamera, getCameraOwner } from './cameraOwnerState';
import { getCameraShakeOffset } from './cameraShake';
import { getCameraPOI } from './cameraPOI';
import {
  AUTO_FOLLOW_MIN_YAW_DELTA,
  AUTO_FOLLOW_RETURN_SPEED,
  FIRST_PERSON_ENABLED,
} from './cameraConstants';
import type { CameraModeContext, CameraModeTarget, SpringOverride } from './types';
import { getInteractionState } from '@/components/3d/InteractionSystemBridge';
import { InteractionState } from '@/engine/interaction/interactionMachine';

/** Pre-allocated temps for camera roll (avoid 4× Vector3 alloc per frame). */
const _rollUp = new THREE.Vector3(0, 1, 0);
const _rollForward = new THREE.Vector3();
const _rollRight = new THREE.Vector3();
const _rollRolledUp = new THREE.Vector3();

/* ── Walking head bob state ── */
let _walkBobPhase = 0;
const WALK_BOB_AMPLITUDE = 0.012; // 12mm vertical displacement
const WALK_BOB_SPEED = 10;       // rad/s — matches walking pace
const WALK_BOB_SPEED_THRESHOLD = 0.5; // minimum player speed to activate
const WALK_BOB_SPEED_FULL = 3.0;     // speed at which bob is at full intensity
const WALK_BOB_BLEND_SPEED = 4;       // how fast bob intensity transitions

export interface PostModeFrameState {
  isInDialogue: boolean;
  isCutscene: boolean;
  isCombat: boolean;
  isDragging: boolean;
  wasDragging: boolean;
  playerMovingTimer: number;
}

/** Minimum squared distance from camera to look target — below this, lookAt degenerates. */
const LOOK_AT_MIN_DIST_SQ = 1e-8;

/** Shared post-mode logic: dialogue transitions, spring, shake, auto-follow, POI */
export function applyCameraFrame(
  ctx: CameraModeContext,
  targets: CameraModeTarget,
  frameState: PostModeFrameState,
  springOverride?: SpringOverride,
): void {
  const { spring, camera: cam, delta, playerPos, playerVelocity } = ctx;
  const { targetPos, targetLook, targetFov, targetRoll } = targets;

  const isInDialogue = frameState.isInDialogue;
  const isCutscene = frameState.isCutscene;
  const isCombat = frameState.isCombat;

  if (isInDialogue && !ctx.wasInDialogue) {
    if (ctx.dialogueController) {
      resetDialogueShotController(ctx.dialogueController);
    }
    setGlobalTimeScale(0.92);
  }
  if (!isInDialogue && ctx.wasInDialogue) {
    setGlobalTimeScale(1.0);
  }

  const isFpExploration =
    FIRST_PERSON_ENABLED && !isInDialogue && !isCutscene && !isCombat;

  // ── Walking head bob (third-person exploration only) ──
  if (!isInDialogue && !isCutscene && !isCombat && !isFpExploration) {
    const playerSpeed = playerVelocity.length();

    // Accumulate bob phase based on time (always ticks so it stays in sync)
    _walkBobPhase += WALK_BOB_SPEED * delta;

    if (playerSpeed > WALK_BOB_SPEED_THRESHOLD) {
      // Smooth intensity ramp: 0 at threshold, 1.0 at full running speed
      const speedNorm = Math.min(
        (playerSpeed - WALK_BOB_SPEED_THRESHOLD) / (WALK_BOB_SPEED_FULL - WALK_BOB_SPEED_THRESHOLD),
        1.0,
      );
      const bobIntensity = 1 - Math.exp(-WALK_BOB_BLEND_SPEED * speedNorm);
      const bobOffset = Math.sin(_walkBobPhase) * WALK_BOB_AMPLITUDE * bobIntensity;
      targetPos.y += bobOffset;
    }

    // Breathing idle (only when standing still)
    const exploration = ctx.exploration;
    if (exploration && exploration.breathingIntensity > 0.001) {
      applyEnhancedBreathingIdle(
        targetPos,
        ctx.time,
        exploration.breathingIntensity,
      );
    }
  } else {
    // Reset bob phase when not in exploration to avoid jarring snap on mode switch
    _walkBobPhase = 0;
  }

  if (isFpExploration) {
    spring.position.copy(targetPos);
    spring.velocity.set(0, 0, 0);
    spring.lookAt.copy(targetLook);
    spring.roll = targetRoll;
    spring.fov = THREE.MathUtils.lerp(spring.fov, targetFov, 1 - Math.exp(-3 * delta));
  } else {
    updateSpringCamera(
      spring, targetPos, targetLook, targetFov, delta, targetRoll,
      springOverride?.stiffness,
      springOverride?.damping,
    );
  }

  if (!canWriteCamera(getCameraOwner())) return;

  const shakeOffset = getCameraShakeOffset(delta);
  cam.position.set(
    spring.position.x + shakeOffset.x,
    spring.position.y + shakeOffset.y,
    spring.position.z,
  );

  if (!isInDialogue && !isCutscene && !isDragging(frameState) && !FIRST_PERSON_ENABLED) {
    const playerSpeed = playerVelocity.length();
    const targetYaw = ctx.playerRotation + Math.PI;

    let yawDiff = targetYaw - ctx.yaw;
    while (yawDiff > Math.PI) yawDiff -= Math.PI * 2;
    while (yawDiff < -Math.PI) yawDiff += Math.PI * 2;

    // Auto-follow camera — smoother to prevent jitter.
    // Previous: AUTO_FOLLOW_SPEED=3.0 with followStrength scaling caused
    // jittery rotation when player speed oscillated around threshold.
    // New: use a gentler speed (1.5) and remove followStrength scaling —
    // the camera now follows at a constant, smooth rate. The higher
    // threshold (0.5 instead of 0.3) prevents micro-rotations when the
    // player taps movement keys rhythmically.
    if (playerSpeed > 0.5) {
      if (Math.abs(yawDiff) > AUTO_FOLLOW_MIN_YAW_DELTA) {
        ctx.yaw += yawDiff * (1 - Math.exp(-1.5 * delta));
      }
      frameState.playerMovingTimer = 0;
    } else if (!frameState.isDragging && !frameState.wasDragging) {
      frameState.playerMovingTimer += delta;
      if (frameState.playerMovingTimer > 2.0 && Math.abs(yawDiff) > 0.3) {
        ctx.yaw += yawDiff * (1 - Math.exp(-AUTO_FOLLOW_RETURN_SPEED * delta));
      }
    }
  }

  const playerSpeedForPOI = playerVelocity.length();
  const poi = getCameraPOI(delta);
  if (poi && !isInDialogue && !isCutscene && !frameState.isDragging && playerSpeedForPOI < 0.1 && frameState.playerMovingTimer > 2.0) {
    const dirToPOI = Math.atan2(poi.x - playerPos.x, poi.z - playerPos.z);
    let yawDiff = dirToPOI - ctx.yaw;
    while (yawDiff > Math.PI) yawDiff -= Math.PI * 2;
    while (yawDiff < -Math.PI) yawDiff += Math.PI * 2;
    ctx.yaw += yawDiff * (1 - Math.exp(-1.0 * delta));
  }

  _rollForward.subVectors(spring.lookAt, cam.position);
  const hasLookDirection = _rollForward.lengthSq() > LOOK_AT_MIN_DIST_SQ;

  if (hasLookDirection) {
    cam.lookAt(spring.lookAt);
  }

  cam.fov = spring.fov;

  if (hasLookDirection && Math.abs(spring.roll) > 0.0001) {
    _rollForward.normalize();
    _rollRight.crossVectors(_rollForward, _rollUp).normalize();
    _rollRolledUp.copy(_rollUp).applyAxisAngle(_rollRight, spring.roll);
    cam.up.copy(_rollRolledUp);
  } else {
    cam.up.set(0, 1, 0);
  }

  cam.updateProjectionMatrix();

  frameState.wasDragging = frameState.isDragging;
}

export function isInDialogueInteraction(): boolean {
  const state = getInteractionState();
  return (
    state === InteractionState.Dialogue ||
    state === InteractionState.Lock ||
    state === InteractionState.Align
  );
}

function isDragging(frameState: PostModeFrameState): boolean {
  return frameState.isDragging;
}
