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
  AUTO_FOLLOW_SPEED,
  AUTO_FOLLOW_IDLE_THRESHOLD,
  AUTO_FOLLOW_MIN_YAW_DELTA,
  AUTO_FOLLOW_RETURN_SPEED,
  FIRST_PERSON_ENABLED,
} from './cameraConstants';
import type { CameraModeContext, CameraModeTarget } from './types';
import { getInteractionState } from '@/components/3d/InteractionSystemBridge';
import { InteractionState } from '@/engine/interaction/interactionMachine';

/** Pre-allocated temps for camera roll (avoid 4× Vector3 alloc per frame). */
const _rollUp = new THREE.Vector3(0, 1, 0);
const _rollForward = new THREE.Vector3();
const _rollRight = new THREE.Vector3();
const _rollRolledUp = new THREE.Vector3();

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

  if (!isInDialogue && !isCutscene && !isCombat && !isFpExploration) {
    const exploration = ctx.exploration;
    if (exploration && exploration.breathingIntensity > 0.001) {
      applyEnhancedBreathingIdle(
        targetPos,
        ctx.time,
        exploration.breathingIntensity,
      );
    }
  }

  if (isFpExploration) {
    spring.position.copy(targetPos);
    spring.velocity.set(0, 0, 0);
    spring.lookAt.copy(targetLook);
    spring.roll = targetRoll;
    spring.fov = THREE.MathUtils.lerp(spring.fov, targetFov, 1 - Math.exp(-3 * delta));
  } else {
    updateSpringCamera(spring, targetPos, targetLook, targetFov, delta, targetRoll);
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

    if (playerSpeed > AUTO_FOLLOW_IDLE_THRESHOLD) {
      if (Math.abs(yawDiff) > AUTO_FOLLOW_MIN_YAW_DELTA) {
        const followStrength = Math.min(1, Math.abs(yawDiff) / Math.PI);
        ctx.yaw += yawDiff * (1 - Math.exp(-AUTO_FOLLOW_SPEED * followStrength * delta));
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
  if (poi && !isInDialogue && !isCutscene && !frameState.isDragging && playerSpeedForPOI < 0.1) {
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
