import { eventBus } from '@/engine/EventBus';
import { audioEngine } from '@/engine/AudioEngine';
import { KCC_STUCK_FRAMES_BEFORE_RECREATE } from '@/engine/player/playerConstants';
import {
  logKccRecreateAttempt,
  notifyKccUnstuck,
  restoreKccMovementMode,
} from '@/engine/player/directMovementTelemetry';
import { shouldAttemptKccRecreate } from '@/engine/player/kccRecoveryState';
import type { PlayerMovementDeps } from '@/engine/player/playerFrameTypes';

/** Base footstep interval at walk speed (seconds) — unchanged from session 1. */
const BASE_FOOTSTEP_INTERVAL = 0.4;
/** Minimum footstep interval at sprint speed — produces rapid but audible cadence. */
const MIN_FOOTSTEP_INTERVAL = 0.2;
/** Player horizontal speed where footstep interval is at minimum (m/s). */
const FULL_SPRINT_SPEED = 7.0;
/** Pitch variation range per step — adds subtle timbre variety (0.9–1.1). */
const STEP_PITCH_RANGE = 0.1;
/** Upper threshold for switching from idle to walk/run (m/s).
 *  Wider than previous 0.5 — with KEYBOARD_ACCEL=50 the velocity reaches
 *  walk speed in ~0.08s, so the old 0.25 band was too narrow to prevent
 *  idle↔walk flickering. Now the band is 0.45 m/s wide (0.6–0.15). */
const ANIM_UPPER_THRESHOLD = 0.6;
/** Lower threshold for reverting from walk/run to idle (m/s) —
 *  Widened from 0.25 to 0.15 to create a larger hysteresis band that
 *  prevents animation state flickering when velocity oscillates near
 *  the boundary during rapid acceleration/deceleration cycles. */
const ANIM_LOWER_THRESHOLD = 0.15;

/**
 * Session 12-B: module-level ref tracking the previous frame's
 * `currentAnimRef.current` value, used to detect the idle→walk/run edge
 * and fire an immediate first footstep on that transition. Without this,
 * the first footstep after the player starts moving (e.g. after the intro
 * wake cinematic ends) waits the full `BASE_FOOTSTEP_INTERVAL` (0.4s) —
 * creating a "silent first step" where the walk animation starts immediately
 * but the audio lags by 0.4s. Pre-saturating `footstepTimerRef` to
 * `BASE_FOOTSTEP_INTERVAL` on the edge causes the next frame's `>=` check
 * to fire immediately (regardless of the actual `stepInterval`, which is
 * always ≤ `BASE_FOOTSTEP_INTERVAL`).
 *
 * Module-level is safe here — there is only one player instance, and the
 * ref correctly tracks the edge across scene transitions (the player's
 * `currentAnimRef` resets to 'idle' on remount, so the next walk start
 * still fires the edge).
 */
let prevAnimForFootstep: string = 'idle';

/** Animations, footsteps, position sync, ground enforce, DEV timing. */
export function finalizePlayerFrame(deps: PlayerMovementDeps): void {
  const scratch = deps.frameScratchRef.current;
  const rb = scratch.rb!;
  if (!rb.isValid()) return;
  const vel = scratch.vel;
  const dt = scratch.dt;
  const {
    airborneIntent,
    isGroundedNow,
    onFlatGround,
    isOutdoor,
    isMoving,
    running,
    keyboardDrivesMove,
    blockedByWall,
    groundY,
    justLanded,
  } = scratch;

  deps.currentFloorMaterialRef.current = deps.config.floorMaterial;

  // Declare early so landing handler (which fires on justLanded) can use it
  let finalPos = rb.translation();

  // ── Landing impact footstep + cinematic dust ──
  if (justLanded) {
    deps.footstepTimerRef.current = 0;
    audioEngine.playFootstep(deps.currentFloorMaterialRef.current, {
      sourceId: 'player-landing',
    });

    // AAA: rich landing dust burst (visual weight + living world)
    const impact = Math.min(1, Math.abs(scratch.landingImpactVel || 0) / 12);
    eventBus.emit('player:landed', {
      position: [finalPos.x, finalPos.y, finalPos.z],
      impact,
      yaw: deps.livePlayerRotationRef.current,
      sceneId: deps.sceneId,
    });
  }

  const horizontalSpeed = Math.sqrt(vel.x * vel.x + vel.z * vel.z);
  const animPos = rb.translation();
  // ── Ground state: trust KCC as primary, rescue fallback for micro-hover ──
  if (isGroundedNow) {
    deps.isGroundedRef.current = true;
    deps.coyoteTimerRef.current = 0;
    if (Math.abs(vel.y) < 0.25) vel.y = 0;
  } else if (!airborneIntent) {
    // KCC says not grounded, no jump intent — rescue fallback only for micro-hover
    const microHovering = animPos.y <= groundY + 0.02 && Math.abs(vel.y) < 0.15;
    if (microHovering) {
      deps.isGroundedRef.current = true;
      vel.y = 0;
    } else {
      deps.isGroundedRef.current = false;
      if (animPos.y > groundY + 0.08 || vel.y > 0.35) {
        deps.currentAnimRef.current = vel.y > 0.5 ? 'jump' : 'fall';
      }
    }
  } else {
    // airborneIntent=true, KCC says not grounded — clearly airborne
    deps.isGroundedRef.current = false;
  }

  // ── Animation state (hysteresis band prevents idle↔walk flickering) ──
  if (deps.isGroundedRef.current) {
    const lockedThreshold = scratch.isLocked ? 0.12 : ANIM_UPPER_THRESHOLD;
    const lockedLowerThreshold = scratch.isLocked ? 0.06 : ANIM_LOWER_THRESHOLD;
    const prevState = deps.currentAnimRef.current;
    const wasLocomoting = prevState === 'walk' || prevState === 'run';

    if (horizontalSpeed > lockedThreshold) {
      deps.currentAnimRef.current = running ? 'run' : 'walk';
    } else if (horizontalSpeed < lockedLowerThreshold || !wasLocomoting) {
      deps.currentAnimRef.current = 'idle';
    }
    // Between thresholds while locomoting: keep current state unchanged

    // Publish the actual horizontal speed for the continuous walk↔run blend.
    // Animation-side only — KCC physics speed itself stays binary per invariants.
    deps.currentHSpeedRef.current = horizontalSpeed;
  }

  if ((isMoving || horizontalSpeed > 0.5) && deps.isGroundedRef.current) {
    // Session 12-B: detect the idle→walk/run edge. When the player starts
    // moving after being idle (e.g. after the intro wake cinematic ends +
    // the player presses W), pre-saturate the footstep timer so the next
    // frame's `>=` check fires a footstep immediately. Without this, the
    // first step waits the full BASE_FOOTSTEP_INTERVAL (0.4s) while the
    // walk animation starts immediately — creating a "silent first step".
    // BASE_FOOTSTEP_INTERVAL is the maximum possible stepInterval (easedSpeed=0),
    // so pre-saturating to it guarantees the `>=` check fires regardless of
    // the actual easedSpeed-based stepInterval this frame.
    const currentAnim = deps.currentAnimRef.current;
    const wasIdle = prevAnimForFootstep === 'idle';
    const isNowWalkOrRun = currentAnim === 'walk' || currentAnim === 'run';
    if (wasIdle && isNowWalkOrRun) {
      deps.footstepTimerRef.current = BASE_FOOTSTEP_INTERVAL;
    }
    prevAnimForFootstep = currentAnim;

    deps.footstepTimerRef.current += dt;

    // ── Session 9: Smooth speed-linked footstep frequency ──
    // Instead of binary walk (0.4s) / run (0.26s), we lerp the interval
    // based on actual horizontal speed. This produces natural acceleration
    // and deceleration cadence.
    const speedNorm = Math.min(horizontalSpeed / FULL_SPRINT_SPEED, 1.0);
    // Ease-out curve: most of the interval compression happens at higher speeds
    const easedSpeed = 1 - (1 - speedNorm) * (1 - speedNorm);
    const stepInterval = BASE_FOOTSTEP_INTERVAL
      - (BASE_FOOTSTEP_INTERVAL - MIN_FOOTSTEP_INTERVAL) * easedSpeed;

    if (deps.footstepTimerRef.current >= stepInterval) {
      deps.footstepTimerRef.current = 0;
      const pos = rb.translation();
      // Emit for future subscribers (NPC hearing, particle dust, etc.).
      eventBus.emit('exploration:footstep', {
        position: [pos.x, pos.y, pos.z],
        yaw: deps.livePlayerRotationRef.current,
        speed: horizontalSpeed,
        easedSpeed,
      });
      // Subtle pitch rise with gait — faster steps sound slightly more urgent.
      const pitchOffset = easedSpeed * STEP_PITCH_RANGE;
      // Skip audio when tab is hidden — prevents backlog hitch on focus return.
      if (typeof document === 'undefined' || document.visibilityState === 'visible') {
        audioEngine.playFootstep(deps.currentFloorMaterialRef.current, {
          sourceId: 'player-footstep',
          pitchOffset,
        });
      }
    }
  } else {
    deps.footstepTimerRef.current = 0;
    // Session 12-B: keep prevAnimForFootstep in sync with currentAnimRef even
    // when not moving, so the next idle→walk edge fires correctly. Without
    // this, prevAnimForFootstep would stay 'walk' from the last moving frame
    // and the next walk-start wouldn't be detected as an edge (no immediate
    // first footstep).
    prevAnimForFootstep = deps.currentAnimRef.current;
  }

  const finalGroundY = groundY;

  // Single floor snap: only rescue micro-hover when KCC disagrees and we are
  // not intentionally airborne — avoids fighting grounded resolution (vertical twitch).
  const floorSnapEps = isOutdoor ? 0.02 : 0.008;
  const microHover =
    !airborneIntent &&
    vel.y <= 0 &&
    finalPos.y <= finalGroundY + 0.05 &&
    Math.abs(finalPos.y - finalGroundY) > floorSnapEps;
  if (onFlatGround && !isGroundedNow && microHover) {
    rb.setTranslation({ x: finalPos.x, y: finalGroundY, z: finalPos.z }, true);
    vel.y = 0;
    deps.isGroundedRef.current = true;
    finalPos = rb.translation();
  }

  deps.livePlayerPositionRef.current.set(finalPos.x, finalPos.y, finalPos.z);

  if (isMoving && !blockedByWall && !keyboardDrivesMove) {
    const dx = finalPos.x - deps.prevRbPosRef.current.x;
    const dz = finalPos.z - deps.prevRbPosRef.current.z;
    const posDelta = Math.sqrt(dx * dx + dz * dz);
    if (posDelta < 0.001) {
      deps.noMovementFramesRef.current++;
      if (deps.noMovementFramesRef.current >= KCC_STUCK_FRAMES_BEFORE_RECREATE) {
        if (shouldAttemptKccRecreate(deps.directMovementTelemetry.recreateAttemptsRef.current)) {
          logKccRecreateAttempt(deps.directMovementTelemetry, 'input_no_displacement', {
            sceneId: deps.sceneId,
            stuckFrames: deps.noMovementFramesRef.current,
          });
          const recreated = deps.recreateCharacterController();
          if (recreated && deps.capsuleColliderRef.current) {
            deps.frameScratchRef.current.controller = recreated;
            deps.noMovementFramesRef.current = 0;
            if (deps.controlsDegradedRef.current) {
              restoreKccMovementMode(deps.directMovementTelemetry, { sceneId: deps.sceneId });
            } else if (deps.directMovementTelemetry.recreateAttemptsRef.current === 1) {
              notifyKccUnstuck({ sceneId: deps.sceneId });
            }
          }
        }
      }
    } else {
      deps.noMovementFramesRef.current = 0;
    }
  } else {
    deps.noMovementFramesRef.current = 0;
  }
  deps.prevRbPosRef.current.set(finalPos.x, finalPos.y, finalPos.z);
}