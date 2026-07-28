import * as THREE from 'three';
import {
  updateSpringCamera,
  applyEnhancedBreathingIdle,
  resetDialogueShotController,
  setGlobalTimeScale,
  DEFAULT_FOV,
} from './cinematicCamera';
import { canWriteCamera, getCameraOwner } from './cameraOwnerState';
import { getCameraShakeOffset } from './cameraShake';
import { getCameraPOI } from './cameraPOI';
import { resetDialogueCameraDrift } from './dialogueCameraDrift';
import {
  AUTO_FOLLOW_MIN_YAW_DELTA,
  AUTO_FOLLOW_RETURN_SPEED,
  FIRST_PERSON_ENABLED,
} from './cameraConstants';
import type { CameraModeContext, CameraModeTarget, SpringOverride } from './types';
import { getInteractionState } from '@/components/3d/InteractionSystemBridge';
import { InteractionState } from '@/engine/interaction/interactionMachine';
import { isEffectiveReducedMotion } from '@/engine/accessibility/accessibilitySettings';

/** Pre-allocated temps for camera roll (avoid 4× Vector3 alloc per frame). */
const _rollUp = new THREE.Vector3(0, 1, 0);
const _rollForward = new THREE.Vector3();
const _rollRight = new THREE.Vector3();
const _rollRolledUp = new THREE.Vector3();
/** Pre-allocated temp for camera forward direction (backward-movement detection). */
const _camFwd = new THREE.Vector3();

/* ── Walking head bob state ── */
let _walkBobPhase = 0;
// FIX 1.2: Smoothed delta for walk-bob phase accumulation. Phase-based
// oscillators are extremely sensitive to per-frame delta variance — a 50fps
// frame followed by a 60fps frame produces a visible phase jump that reads
// as micro-jitter even when amplitude is small. We maintain a moving-average
// delta so the phase advances uniformly regardless of frame rate variance.
let _smoothedDelta = 1 / 60;
const WALK_BOB_AMPLITUDE = 0.006; // 6mm vertical displacement (halved from 0.012 to reduce micro-jitter)
const WALK_BOB_SPEED = 10;       // rad/s — matches walking pace
const WALK_BOB_SPEED_THRESHOLD = 0.5; // minimum player speed to activate
const WALK_BOB_SPEED_FULL = 3.0;     // speed at which bob is at full intensity
const WALK_BOB_BLEND_SPEED = 4;       // how fast bob intensity transitions
// Delta smoothing factor: low value = more smoothing (less responsive to spikes).
// 0.15 means ~7 frames of history — enough to absorb frame drops without
// making the bob lag visibly behind player movement.
const WALK_BOB_DELTA_SMOOTH = 0.15;

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

/** Clamp FOV to a safe finite range, falling back to DEFAULT_FOV if NaN/Infinity. */
function safeFov(fov: number): number {
  return Number.isFinite(fov) ? fov : DEFAULT_FOV;
}

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
    // Part 2B: Reset dialogue camera drift state so the next dialogue session
    // starts with a fresh drift phase (otherwise the circular motion resumes
    // mid-cycle and the push-in trigger from the previous session's last
    // node is lost).
    resetDialogueCameraDrift();
  }

  const isFpExploration =
    FIRST_PERSON_ENABLED && !isInDialogue && !isCutscene && !isCombat;

  // ── Walking head bob (third-person exploration only) ──
  // Skip bob + breathing under reduced motion (matches FPS arms / shake gates).
  if (!isInDialogue && !isCutscene && !isCombat && !isFpExploration && !isEffectiveReducedMotion()) {
    const playerSpeed = playerVelocity.length();

    // FIX 1.2: Smooth the delta used for phase advance. Raw r3f delta at
    // variable frame rates (50-60fps oscillation, occasional frame drops)
    // produces uneven phase advance → `Math.sin(_walkBobPhase)` becomes
    // non-uniform and reads as visible micro-jitter. The smoothed delta
    // absorbs the per-frame variance while still tracking real time over
    // a ~7-frame window. Prior Phase 5.5 halved the amplitude but didn't
    // fix the uneven phase, so the jitter was reduced but not eliminated.
    _smoothedDelta += (delta - _smoothedDelta) * WALK_BOB_DELTA_SMOOTH;

    // Accumulate bob phase based on smoothed time (always ticks so it stays in sync)
    _walkBobPhase += WALK_BOB_SPEED * _smoothedDelta;

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
    // Also reset smoothed delta so it starts fresh on next exploration entry
    _smoothedDelta = 1 / 60;
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

    // Detect backward movement: if the player's velocity is pointing toward
    // the camera (i.e., the player is backing up toward the camera), do NOT
    // auto-follow the body rotation. The recent rotation fix makes the player
    // turn 180° to face the camera when S is pressed — without this guard,
    // `targetYaw = bodyYaw + π` would flip π and the camera would spin around
    // to be behind the player's NEW facing, which is disorienting.
    //
    // We compute the dot product of playerVelocity with the camera's forward
    // direction (toward where the camera looks). If the dot is negative, the
    // player is moving toward the camera (backward) → skip auto-follow.
    cam.getWorldDirection(_camFwd);
    _camFwd.y = 0;
    if (_camFwd.lengthSq() > 1e-6) _camFwd.normalize();
    else _camFwd.set(0, 0, -1);
    const forwardVel = playerVelocity.dot(_camFwd);
    const isMovingBackward = forwardVel < -0.3;

    // Auto-follow camera — continuous speed-weighted blend (no hard threshold).
    // Previous versions used a hard threshold (playerSpeed > 0.5) which caused
    // on/off flickering when speed oscillated around the boundary. Now we use
    // a continuous followStrength that scales from 0 at rest to 1 at full speed,
    // making auto-follow transitions smooth and gradual.
    if (!isMovingBackward) {
      const followStrength = Math.min(playerSpeed / 1.0, 1.0); // 0→1 as speed 0→1 m/s
      if (followStrength > 0.01 && Math.abs(yawDiff) > AUTO_FOLLOW_MIN_YAW_DELTA) {
        ctx.yaw += yawDiff * followStrength * (1 - Math.exp(-1.5 * delta));
      }
      if (followStrength > 0.1) {
        frameState.playerMovingTimer = 0;
      }
    } else if (playerSpeed > 0.3) {
      // Backward movement: still counts as "moving" for the idle timer reset
      // (so the camera doesn't auto-rotate to POI while the player is backing
      // up), but we don't update ctx.yaw — the camera stays put.
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

  // Always reset up vector to default before lookAt, so zero-distance frames
  // don't leave cam.up in a stale rolled state from a previous cutscene.
  cam.up.set(0, 1, 0);

  // Three.js handles zero-length lookAt gracefully (preserves current orientation),
  // so call unconditionally to avoid leaving the camera facing a wrong direction
  // after scene transitions where position === lookAt (e.g. both [0,0,0]).
  cam.lookAt(spring.lookAt);

  // M1: Guard against NaN/Infinity FOV from corrupted spring state (e.g. lerp
  // with NaN targetFov in a cutscene transition). Without this, cam.fov = NaN
  // causes updateProjectionMatrix() to produce a degenerate projection and the
  // entire render becomes a blank/inverted screen.
  cam.fov = safeFov(spring.fov);

  // Apply camera roll only when there's a valid look direction.
  if (hasLookDirection && Math.abs(spring.roll) > 0.0001) {
    _rollForward.normalize();
    _rollRight.crossVectors(_rollForward, _rollUp).normalize();
    _rollRolledUp.copy(_rollUp).applyAxisAngle(_rollRight, spring.roll);
    cam.up.copy(_rollRolledUp);
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