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
  EXPLORATION_SOFT_AUTO_FOLLOW,
  FIRST_PERSON_ENABLED,
} from './cameraConstants';
import type { CameraModeContext, CameraModeTarget, SpringOverride } from './types';
import { getInteractionState } from '@/components/3d/InteractionSystemBridge';
import { InteractionState } from '@/engine/interaction/interactionMachine';
import { isEffectiveReducedMotion } from '@/engine/accessibility/accessibilitySettings';
import {
  setListenerPosition,
  setListenerOrientation,
} from '@/engine/SharedAudioContext';

/** Pre-allocated temps for camera roll (avoid 4× Vector3 alloc per frame). */
const _rollUp = new THREE.Vector3(0, 1, 0);
const _rollForward = new THREE.Vector3();
const _rollRight = new THREE.Vector3();
const _rollRolledUp = new THREE.Vector3();
/** Pre-allocated temp for camera forward direction (backward-movement detection + listener orientation). */
const _camFwd = new THREE.Vector3();

/* ── AudioListener frame throttle ──
 * Module-level counter so the listener update fires every 3rd frame
 * (~20 Hz at 60fps). Per-frame updates are wasteful — the listener's
 * perceptual resolution is ~50ms, and SharedAudioContext further
 * sub-throttles by 0.1m delta. */
let _listenerFrameCounter = 0;

/* ── Walking head bob state ── */
let _walkBobPhase = 0;
// FIX 1.2: Smoothed delta for walk-bob phase accumulation. Phase-based
// oscillators are extremely sensitive to per-frame delta variance — a 50fps
// frame followed by a 60fps frame produces a visible phase jump that reads
// as micro-jitter even when amplitude is small. We maintain a moving-average
// delta so the phase advances uniformly regardless of frame rate variance.
let _smoothedDelta = 1 / 60;
const WALK_BOB_AMPLITUDE = 0.006; // 6mm vertical displacement (halved from 0.012 to reduce micro-jitter)
const WALK_BOB_BASE_SPEED = 10;       // rad/s — matches walking pace (AAA filmic gait)
const WALK_BOB_SPEED_THRESHOLD = 0.5; // minimum player speed to activate
const WALK_BOB_SPEED_FULL = 3.0;     // speed at which bob is at full intensity
const WALK_BOB_BLEND_SPEED = 4;       // how fast bob intensity transitions
// Delta smoothing factor: low value = more smoothing (less responsive to spikes).
// 0.15 means ~7 frames of history — enough to absorb frame drops without
// making the bob lag visibly behind player movement.
const WALK_BOB_DELTA_SMOOTH = 0.15;

// AAA Phase B refinement: bob frequency scales continuously with speed
// so vertical + lateral bob perfectly tracks the walk/run animation cycle
// (no plastic float, cinematic weight transfer). Uses same band as smoothstep locomotion.
const WALK_BOB_SPEED_MIN = 8.5;   // at walk threshold
const WALK_BOB_SPEED_MAX = 14.5;  // at full sprint — matches ~1.45x anim timeScale energy

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

  let bobLeanRoll = 0;

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

    // AAA Phase B: continuous speed-linked bob frequency — perfectly syncs
    // camera gait with locomotion blend tree (walk/run timeScales 1.05→1.45)
    // + footstep cadence. No plastic float. Film-grade weight transfer.
    // Also blend with moveBlend for ultra-smooth accel feel (0 when idle).
    const moveBlend = ctx.moveBlend ?? 0;
    const speedNormForBob = playerSpeed > WALK_BOB_SPEED_THRESHOLD
      ? Math.min(1, (playerSpeed - WALK_BOB_SPEED_THRESHOLD) / (WALK_BOB_SPEED_FULL - WALK_BOB_SPEED_THRESHOLD))
      : 0;
    const blendedSpeedNorm = Math.max(speedNormForBob, moveBlend * 0.6); // gentle floor from blend
    const dynamicBobSpeed = WALK_BOB_BASE_SPEED + (WALK_BOB_SPEED_MAX - WALK_BOB_SPEED_MIN) * blendedSpeedNorm;

    // Accumulate bob phase based on smoothed time (always ticks so it stays in sync)
    _walkBobPhase += dynamicBobSpeed * _smoothedDelta;

    if (playerSpeed > WALK_BOB_SPEED_THRESHOLD) {
      // Smooth intensity ramp: 0 at threshold, 1.0 at full running speed
      const speedNorm = speedNormForBob;
      const bobIntensity = 1 - Math.exp(-WALK_BOB_BLEND_SPEED * speedNorm);
      // AAA Phase B: amplitude also scales with speed for satisfying cinematic weight
      // at sprint (heavier footfalls read in camera) — still micro (max ~7.2mm)
      const ampScale = 0.8 + 0.4 * speedNorm; // 0.8x at walk → 1.2x at sprint
      const bobOffset = Math.sin(_walkBobPhase) * WALK_BOB_AMPLITUDE * bobIntensity * ampScale;
      targetPos.y += bobOffset;

      // ── Lateral bob — camera-relative horizontal sway at HALF the vertical
      //    frequency, producing the classic figure-8 camera gait. The body
      //    sways once per stride while bobbing twice → reads as "walking",
      //    not "floating". Camera-relative (uses view forward → right vector)
      //    so the sway is always perpendicular to gaze, not world-space X.
      //    Amplitude is half the Y bob (3mm) — subtle, below nausea threshold.
      //    Session 9: "perfect movement animation" polish. ──
      const fwdX = targetLook.x - targetPos.x;
      const fwdZ = targetLook.z - targetPos.z;
      const fwdLen = Math.hypot(fwdX, fwdZ);
      if (fwdLen > 0.0001) {
        // Right vector = forward × up(0,1,0) → (fwdZ, 0, -fwdX), normalized.
        const rx = fwdZ / fwdLen;
        const rz = -fwdX / fwdLen;
        const lateralBob = Math.cos(_walkBobPhase * 0.5) * WALK_BOB_AMPLITUDE * 0.5 * bobIntensity;
        targetPos.x += rx * lateralBob;
        targetPos.z += rz * lateralBob;

        // AAA Phase B: tiny cinematic roll lean during fast movement (subtle momentum feel)
        // Adds ~0.8° lean into the stride direction at full sprint — feels weighty, not floaty.
        // Uses same phase as vertical for perfect stride sync.
        if (bobIntensity > 0.2) {
          bobLeanRoll = Math.sin(_walkBobPhase * 0.5) * 0.014 * bobIntensity * speedNorm; // ~0.8° max
        }
      }
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

  const effectiveRoll = targetRoll + bobLeanRoll;

  if (isFpExploration) {
    spring.position.copy(targetPos);
    spring.velocity.set(0, 0, 0);
    spring.lookAt.copy(targetLook);
    spring.roll = effectiveRoll;
    spring.fov = THREE.MathUtils.lerp(spring.fov, targetFov, 1 - Math.exp(-3 * delta));
  } else {
    updateSpringCamera(
      spring, targetPos, targetLook, targetFov, delta, effectiveRoll,
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

  if (
    EXPLORATION_SOFT_AUTO_FOLLOW
    && !isInDialogue
    && !isCutscene
    && !isDragging(frameState)
    && !FIRST_PERSON_ENABLED
  ) {
    const playerSpeed = playerVelocity.length();
    const targetYaw = ctx.playerRotation + Math.PI;

    let yawDiff = targetYaw - ctx.yaw;
    while (yawDiff > Math.PI) yawDiff -= Math.PI * 2;
    while (yawDiff < -Math.PI) yawDiff += Math.PI * 2;

    // Detect backward movement: if the player's velocity is pointing toward
    // the camera (i.e., the player is backing up toward the camera), do NOT
    // auto-follow the body rotation.
    cam.getWorldDirection(_camFwd);
    _camFwd.y = 0;
    if (_camFwd.lengthSq() > 1e-6) _camFwd.normalize();
    else _camFwd.set(0, 0, -1);
    const forwardVel = playerVelocity.dot(_camFwd);
    const isMovingBackward = forwardVel < -0.3;

    if (!isMovingBackward) {
      const followStrength = Math.min(playerSpeed / 1.0, 1.0);
      if (followStrength > 0.01 && Math.abs(yawDiff) > AUTO_FOLLOW_MIN_YAW_DELTA) {
        ctx.yaw += yawDiff * followStrength * (1 - Math.exp(-1.5 * delta));
      }
      if (followStrength > 0.1) {
        frameState.playerMovingTimer = 0;
      }
    } else if (playerSpeed > 0.3) {
      frameState.playerMovingTimer = 0;
    } else if (!frameState.isDragging && !frameState.wasDragging) {
      frameState.playerMovingTimer += delta;
      if (frameState.playerMovingTimer > 2.0 && Math.abs(yawDiff) > 0.3) {
        ctx.yaw += yawDiff * (1 - Math.exp(-AUTO_FOLLOW_RETURN_SPEED * delta));
      }
    }
  } else if (!isInDialogue && !isCutscene && !FIRST_PERSON_ENABLED) {
    // Max Payne OTS: no soft auto-follow — still track idle timer for POI.
    const playerSpeed = playerVelocity.length();
    if (playerSpeed > 0.1 || frameState.isDragging) {
      frameState.playerMovingTimer = 0;
    } else {
      frameState.playerMovingTimer += delta;
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

  // AAA Phase B: cinematic sprint forward "thrust" / momentum push on camera
  // When sprinting hard, camera feels like it's being carried forward — delicious weight.
  const speed = playerVelocity.length();
  if (speed > 5.2 && !isInDialogue && !isCutscene && !isFpExploration) {
    const thrust = (speed - 5.2) / 2.5; // 0..0.8 at full sprint
    const fwd = new THREE.Vector3().subVectors(targetLook, targetPos).normalize();
    // Gentle forward push on position (feels like being pulled into the run)
    targetPos.addScaledVector(fwd, thrust * 0.035);
    // Also slightly pull the look target for forward commitment feel
    targetLook.addScaledVector(fwd, thrust * 0.018);
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

  // ── AudioListener tracks the camera (spatial audio prerequisite) ──
  // PannerNode sources (NPC barks, spatial SFX, spatial ambients) are mixed
  // relative to the AudioListener's position + orientation. Without this,
  // every spatial source renders at world-origin with no sense of player
  // motion. Throttled to every 3rd frame (~20 Hz at 60fps) — well above the
  // perceptual threshold for spatial motion. SharedAudioContext also
  // sub-throttles by 0.1m delta, so the effective update rate is lower still.
  // NOTE: agent 9c may also wire this in FollowCamera.tsx — both calls are
  // idempotent (last-write-wins on AudioParam), so the redundancy is harmless.
  _listenerFrameCounter = (_listenerFrameCounter + 1) % 3;
  if (_listenerFrameCounter === 0) {
    try {
      setListenerPosition(cam.position.x, cam.position.y, cam.position.z);
      cam.getWorldDirection(_camFwd);
      setListenerOrientation(
        _camFwd.x, _camFwd.y, _camFwd.z,
        0, 1, 0, // Y-up world (matches cam.up.set(0,1,0) above)
      );
    } catch {
      /* listener may be unavailable during early boot / context teardown */
    }
  }

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