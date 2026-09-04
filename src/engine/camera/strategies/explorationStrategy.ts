import {
  updateExplorationState,
  resolveCameraCollision,
} from '../cinematicCamera';
import { Vector3 } from 'three';
import {
  LOOK_HEIGHT,
  MIN_DISTANCE,
  WALL_MARGIN,
  LOOK_AHEAD_STRENGTH,
  LOOK_AHEAD_LERP_SPEED,
  FIRST_PERSON_ENABLED,
  FIRST_PERSON_EYE_HEIGHT,
  CAMERA_LAG_FACTOR,
  CROUCH_CAMERA_HEIGHT_OFFSET,
  BLOCK_CAMERA_HEIGHT_OFFSET,
} from '../cameraConstants';
import { sharedPlayerCrouchRef, sharedPlayerBlockRef } from '@/engine/PlayerRotationState';
import { applyShoulderOffset } from '../cameraShoulder';
import {
  RUN_FOV_BOOST,
  RUN_FOV_SPEED_FULL,
  RUN_FOV_SPEED_MIN,
} from '@/engine/player/playerConstants';
import { shouldKeepFirstPersonExplorationCamera } from '@/engine/interaction/interactionSession';
import type { CameraModeStrategy } from '../types';
import { consumeLandingFovDip } from '../landingImpact';
import { eventBus } from '@/engine/EventBus';
import {
  registerModuleGlobalCleanupBinder,
} from '@/engine/core/GlobalCleanupService';

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

// AAA Phase B: sprint launch boost flag (armed by player:sprint_start event)
let _sprintLaunchBoost = 0;

// ── Per-frame scratch vectors (audit 2-b P2: the sprint-lean / decel-lean /
// brake paths used to clone Vector3s every frame while running — now reused,
// following the module-scratch pattern from engine/three/frameScratch.ts).
// Single-threaded per-frame use: each consumer copies its inputs in first.
const _scratchLookDir = new Vector3();
const _scratchRight = new Vector3();
const _worldUp = new Vector3(0, 1, 0);

// Arm cinematic sprint launch boost from the exact edge event.
// FIX (revive-safety): раньше подписка была анонимной на уровне модуля без
// сохранённого unsubscribe — disposeGameEngine() стирал её вместе с EventBus,
// а reviveGameEngine() не переподписывал, и спринт-панч FOV/наклона молча
// умирал после ремоунта оркестратора (ErrorBoundary/StrictMode).
// Теперь подписка переустанавливается через registerModuleGlobalCleanupBinder:
// binder вызывается при загрузке модуля и снова из reviveGameEngine().
let _unsubSprintStart: (() => void) | null = null;

function bindSprintStartListener(): void {
  _unsubSprintStart?.();
  _unsubSprintStart = null;
  if (typeof window === 'undefined') return;
  _unsubSprintStart = eventBus.on('player:sprint_start', () => {
    _sprintLaunchBoost = 1.0; // full punch
  });
}

registerModuleGlobalCleanupBinder(bindSprintStartListener);
bindSprintStartListener();

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

    // AAA Phase B: cinematic sprint launch punch — direct, powerful reaction to
    // the exact 'player:sprint_start' edge from playerFinalizeFrame.
    // Delivers an instant luxurious "weight transfer" FOV + lean kick on the very first sprint frame.
    // Perfectly locked with footstep dust launch, audio volume/filter, body lean.
    let launchFovExtra = 0;
    let launchLeanExtra = 0;
    if (_sprintLaunchBoost > 0) {
      // Session 13 (ramp-tame): cinematic sprint-launch FOV + lean punch.
      // Previously 19.5° FOV + 0.355rad (20°) lean — nauseating on every device.
      // Now a subtle, filmic ~2.2° FOV kick + ~2° forward lean that decays over
      // ~0.25s. Reads as weight-transfer, not motion sickness.
      launchFovExtra = _sprintLaunchBoost * 2.2;
      launchLeanExtra = _sprintLaunchBoost * 0.035;
      _sprintLaunchBoost = Math.max(0, _sprintLaunchBoost - ctx.delta * 8);
    }
    fovBoost += launchFovExtra;

    // AAA Phase B: subtle cinematic forward lean (pitch) when sprinting — feels like
    // momentum / weight transfer. ~1.2° max + powerful launch extra. No nausea.
    // HARDER APOCALYPTIC — nuclear forward commitment every sprint stride. Devastating.
    let sprintLeanPitch = 0;
    if (sprintActive) {
      const leanT = Math.min(1, (speedMs - SPRINT_KICK_SPEED_THRESHOLD) / 1.28);
      // Session 13 (ramp-tame): subtle nose-down momentum lean (~2° max).
      // Previously 0.135rad (~7.7°) — too aggressive, caused continuous downward tilt.
      sprintLeanPitch = -0.035 * leanT;
    }
    sprintLeanPitch -= launchLeanExtra;

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

    // Crouch/block camera height offsets (read from shared state written by player movement)
    let stanceOffset = 0;
    if (sharedPlayerCrouchRef.current) stanceOffset += CROUCH_CAMERA_HEIGHT_OFFSET;
    if (sharedPlayerBlockRef.current) stanceOffset += BLOCK_CAMERA_HEIGHT_OFFSET;

    let targetPos = desiredPos.set(
      playerPos.x + offset.x,
      playerPos.y + LOOK_HEIGHT + offset.y + heightOffset + stanceOffset,
      playerPos.z + offset.z,
    );

    // ── Camera lag lerp: smooth interpolation toward target for cinematic weight ──
    // The spring already provides smoothing, but this additional lag factor
    // adds a tangible "heavy camera" feel — the camera drifts behind fast
    // player movement and settles smoothly. Configurable via CAMERA_LAG_FACTOR.
    if (CAMERA_LAG_FACTOR > 0 && ctx.delta > 0) {
      const lagT = 1 - Math.exp(-CAMERA_LAG_FACTOR * ctx.delta * 60);
      const springPos = ctx.spring.position;
      // Only lag when there's meaningful displacement (not at init)
      const dx = targetPos.x - springPos.x;
      const dz = targetPos.z - springPos.z;
      const horizontalDist = Math.sqrt(dx * dx + dz * dz);
      if (horizontalDist > 0.05) {
        // Lerp target back toward spring (spring chases a closer target = lag)
        targetPos.lerp(springPos, lagT * 0.35);
      }
    }

    const targetLook = lookTarget.set(
      playerPos.x + ctx.lookAheadOffset.x,
      playerPos.y + LOOK_HEIGHT + heightOffset + stanceOffset + ctx.lookAheadOffset.y * 0.3,
      playerPos.z + ctx.lookAheadOffset.z,
    );

    // AAA Phase B: apply sprint forward lean (pitch down) to look target for cinematic momentum
    if (sprintLeanPitch !== 0) {
      const lookDir = _scratchLookDir.copy(targetLook).sub(targetPos).normalize();
      // Apply small pitch rotation around right axis
      const right = _scratchRight.crossVectors(lookDir, _worldUp).normalize();
      if (right.lengthSq() > 0.001) {
        lookDir.applyAxisAngle(right, sprintLeanPitch);
        targetLook.copy(targetPos).addScaledVector(lookDir, 12); // keep reasonable distance
      }
    }

    // AAA Phase B: cinematic deceleration settle lean + micro bob settle + "brake" pull
    // Feels like body weight shifting forward then settling back — rich, filmic.
    const prevSpeed = ctx.prevVelocitySmooth.length();
    const decel = Math.max(0, prevSpeed - speedMs);
    if (decel > 1.6 && speedMs < 4.8) {
      const decelLean = Math.min(0.022, decel * 0.009); // nose-up settle
      const lookDir2 = _scratchLookDir.copy(targetLook).sub(targetPos).normalize();
      const right2 = _scratchRight.crossVectors(lookDir2, _worldUp).normalize();
      if (right2.lengthSq() > 0.001) {
        lookDir2.applyAxisAngle(right2, decelLean);
        targetLook.copy(targetPos).addScaledVector(lookDir2, 10);
      }

      // Strong cinematic "brake" camera pull-back on hard stop (opposite of thrust)
      const brakeT = Math.min(1, decel / 3.5);
      // Camera forward direction for brake pull-back (recomputed after the
      // decel lean above already rewrote targetLook).
      const fwd = _scratchLookDir.copy(targetLook).sub(targetPos).normalize();
      // Session 13 (ramp-tame): brake pull-back ~2.5cm max (was 9cm — too violent).
      targetPos.addScaledVector(fwd, -brakeT * 0.025);
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
