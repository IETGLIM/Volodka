import {
  updateExplorationState,
  resolveCameraCollision,
} from '../cinematicCamera';
import * as THREE from 'three';
import {
  LOOK_HEIGHT,
  MIN_DISTANCE,
  WALL_MARGIN,
  LOOK_AHEAD_STRENGTH,
  LOOK_AHEAD_LERP_SPEED,
  FIRST_PERSON_ENABLED,
  FIRST_PERSON_EYE_HEIGHT,
} from '../cameraConstants';
import { applyShoulderOffset } from '../cameraShoulder';
import {
  RUN_FOV_BOOST,
  RUN_FOV_SPEED_FULL,
  RUN_FOV_SPEED_MIN,
} from '@/engine/player/playerConstants';
import { shouldKeepFirstPersonExplorationCamera } from '@/engine/interaction/interactionSession';
import type { CameraModeStrategy } from '../types';
import { consumeLandingFovDip } from '../landingImpact';

// ── Sprint-start FOV kick (envelope decays after the walk→run transition) ──
let _sprintKickEnvelope = 0;
let _prevSprintActive = false;
const SPRINT_KICK_FOV_DEG = 0.6;
const SPRINT_KICK_SPEED_THRESHOLD = 5.5;
const SPRINT_KICK_DECAY = 4;
// ── AAA handheld: subtle idle micro-sway even when still (filmi operator breathing) ──
let _handheldPhase = 0;
const HANDHELD_FREQ = 0.22;
const HANDHELD_AMP = 0.0009;

/** Default spring-based exploration camera with look-ahead and breathing bob */
export const explorationStrategy: CameraModeStrategy = {
  id: 'exploration',
  priority: 10,

  isActive() {
    return true;
  },

  update(ctx) {
    const { playerPos, yaw, pitch, offset, desiredPos, lookTarget, playerVelocity } = ctx;

    // ── First-person: camera at the eyes, look along yaw/pitch ──
    if (FIRST_PERSON_ENABLED && shouldKeepFirstPersonExplorationCamera()) {
      const exploration = ctx.exploration;
      let eyeBaseY = playerPos.y;
      if (exploration) {
        const expResult = updateExplorationState(
          exploration,
          playerPos,
          yaw,
          playerVelocity,
          ctx.delta,
          ctx.moveBlend,
        );
        eyeBaseY = expResult.targetHeight;
      }

      offset.set(
        Math.sin(yaw) * Math.cos(pitch),
        Math.sin(pitch),
        Math.cos(yaw) * Math.cos(pitch),
      );
      const eyeY = eyeBaseY + FIRST_PERSON_EYE_HEIGHT;
      const targetPos = desiredPos.set(playerPos.x, eyeY, playerPos.z);
      const targetLook = lookTarget.set(
        targetPos.x + offset.x * 3,
        targetPos.y + offset.y * 3,
        targetPos.z + offset.z * 3,
      );
      return {
        kind: 'targets',
        mode: 'exploration',
        targets: {
          targetPos,
          targetLook,
          targetFov: ctx.currentSceneFov,
          targetRoll: 0,
        },
      };
    }

    const effectiveDistance = ctx.interactionLocked
      ? ctx.interactionDistance
      : ctx.distance;

    offset.set(
      Math.sin(yaw) * Math.cos(pitch),
      Math.sin(pitch),
      Math.cos(yaw) * Math.cos(pitch),
    );
    offset.multiplyScalar(effectiveDistance);

    // ── Running FOV boost: widen FOV slightly when sprinting for speed feel ──
    // FIX 1.3: `ctx.playerVelocity` is already in m/s (built in FollowCamera
    // as `(playerPos - prevPlayerPos) * (1/delta)`). The previous code divided
    // again by `ctx.delta`, giving m/s² — at 60fps with playerSpeed=4 m/s,
    // speedMs was 240, so `t=1` and FOV was boosted +3° during ANY movement.
    // This produced a constant +3° FOV pulse on movement start/stop. Use
    // playerSpeed directly so RUN_FOV_BOOST actually engages only when
    // sprinting (>5.5 m/s), as designed.
    const playerSpeed = ctx.playerVelocity.length();
    const speedMs = playerSpeed;
    let fovBoost = 0;
    if (speedMs > RUN_FOV_SPEED_MIN) {
      const t = Math.min(1, (speedMs - RUN_FOV_SPEED_MIN) / (RUN_FOV_SPEED_FULL - RUN_FOV_SPEED_MIN));
      fovBoost = t * RUN_FOV_BOOST;
    }
    // Sprint-start FOV "kick" — a brief extra punch on top of the steady boost when
    // the runner crosses into sprint, decaying over ~0.25s. One-shot per sprint entry.
    const sprintActive = speedMs >= SPRINT_KICK_SPEED_THRESHOLD;
    if (sprintActive && !_prevSprintActive) _sprintKickEnvelope = 1;
    _prevSprintActive = sprintActive;
    _sprintKickEnvelope = Math.max(0, _sprintKickEnvelope - ctx.delta * SPRINT_KICK_DECAY);
    fovBoost += _sprintKickEnvelope * SPRINT_KICK_FOV_DEG;

    // AAA Phase B: subtle cinematic forward lean (pitch) when sprinting — feels like
    // momentum / weight transfer. ~1.2° max, instant decay on stop. No nausea.
    let sprintLeanPitch = 0;
    if (sprintActive) {
      const leanT = Math.min(1, (speedMs - SPRINT_KICK_SPEED_THRESHOLD) / 2.0);
      sprintLeanPitch = -0.021 * leanT; // negative = nose-down cinematic lean, ~1.2°
    }
    const baseFov = ctx.currentSceneFov;

    const exploration = ctx.exploration;
    let heightOffset = 0;
    let targetRoll = 0;

    if (exploration) {
      const expResult = updateExplorationState(
        exploration,
        playerPos,
        yaw,
        playerVelocity,
        ctx.delta,
        ctx.moveBlend,
      );
      targetRoll = expResult.targetRoll;
      heightOffset = expResult.targetHeight - playerPos.y;
    }

    // ── AAA handheld micro-sway — operator breathing, only when almost still ──
    _handheldPhase += ctx.delta * HANDHELD_FREQ;
    if (playerSpeed < 0.15) {
      const swayX = Math.sin(_handheldPhase * 1.31) * HANDHELD_AMP;
      const swayY = Math.cos(_handheldPhase * 0.83) * HANDHELD_AMP * 0.6;
      heightOffset += swayY;
      targetRoll += swayX;
    }

    ctx.prevVelocitySmooth.lerp(
      playerVelocity,
      1 - Math.exp(-LOOK_AHEAD_LERP_SPEED * ctx.delta),
    );
    const speed = ctx.prevVelocitySmooth.length();
    // Boost look-ahead by 15% during fast movement (>3 m/s) for smoother fast turns
    const fastBoost = speed > 3 ? 1.15 : 1.0;
    // Sprint look-ahead cap boost: cap grows from 0.3 at walk (≤4 m/s) to 0.45 at
    // full sprint (≥7 m/s) so the camera leads further ahead at speed — reads as
    // momentum/intent. At walk the cap is unchanged (0.3 × 1.15 = 0.345).
    const speedCapBoost = Math.max(0, Math.min(1, (speed - 4) / 3)) * 0.15;
    const lookAheadCap = (0.3 + speedCapBoost) * fastBoost;
    const lookAheadAmount = Math.min(speed * LOOK_AHEAD_STRENGTH * fastBoost, lookAheadCap);
    if (speed > 0.01) {
      ctx.lookAheadOffset.copy(ctx.prevVelocitySmooth).normalize().multiplyScalar(lookAheadAmount);
    } else {
      ctx.lookAheadOffset.set(0, 0, 0);
    }

    let targetPos = desiredPos.set(
      playerPos.x + offset.x,
      playerPos.y + LOOK_HEIGHT + offset.y + heightOffset,
      playerPos.z + offset.z,
    );

    const targetLook = lookTarget.set(
      playerPos.x + ctx.lookAheadOffset.x,
      playerPos.y + LOOK_HEIGHT + heightOffset + ctx.lookAheadOffset.y * 0.3,
      playerPos.z + ctx.lookAheadOffset.z,
    );

    // AAA Phase B: apply sprint forward lean (pitch down) to look target for cinematic momentum
    if (sprintLeanPitch !== 0) {
      const lookDir = targetLook.clone().sub(targetPos).normalize();
      // Apply small pitch rotation around right axis
      const right = new THREE.Vector3().crossVectors(lookDir, new THREE.Vector3(0,1,0)).normalize();
      if (right.lengthSq() > 0.001) {
        lookDir.applyAxisAngle(right, sprintLeanPitch);
        targetLook.copy(targetPos).add(lookDir.multiplyScalar(12)); // keep reasonable distance
      }
    }

    // Max Payne OTS — lateral bias before wall collision so the spring arm
    // still collapses cleanly in tight rooms.
    applyShoulderOffset(targetPos, targetLook, yaw);

    // Breathing bob removed here — applyEnhancedBreathingIdle in applyCameraFrame
    // already adds a breathing oscillation (up to 2mm Y + 0.5mm X/Z after 3s
    // idle). Having both caused double oscillation (up to 7mm peak Y) which
    // looked like camera jitter in small rooms. Now only one breathing source.

    targetPos = resolveCameraCollision(
      ctx.raycaster,
      ctx.sceneChildren,
      targetLook,
      targetPos,
      WALL_MARGIN,
      MIN_DISTANCE,
    );

    return {
      kind: 'targets',
      mode: 'exploration',
      targets: {
        targetPos,
        targetLook,
        targetFov: baseFov + fovBoost - consumeLandingFovDip(ctx.delta),
        targetRoll,
      },
    };
  },
};
