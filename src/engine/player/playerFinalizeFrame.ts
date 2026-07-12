import { eventBus } from '@/engine/EventBus';
import { audioEngine } from '@/engine/AudioEngine';
import { FOOTSTEP_INTERVAL, KCC_STUCK_FRAMES_BEFORE_RECREATE } from '@/engine/player/playerConstants';
import {
  logKccRecreateAttempt,
  restoreKccMovementMode,
} from '@/engine/player/directMovementTelemetry';
import { shouldAttemptKccRecreate } from '@/engine/player/kccRecoveryState';
import type { PlayerMovementDeps } from '@/engine/player/playerFrameTypes';

/** Animations, footsteps, position sync, ground enforce, DEV timing. */
export function finalizePlayerFrame(deps: PlayerMovementDeps): void {
  const scratch = deps.frameScratchRef.current;
  const rb = scratch.rb!;
  if (!rb.isValid()) return;
  const vel = scratch.vel;
  const dt = scratch.dt;
  const {
    airborneIntent,
    floorSlack,
    isGroundedNow,
    onFlatGround,
    isOutdoor,
    isMoving,
    running,
    keyboardDrivesMove,
    blockedByWall,
    groundY,
  } = scratch;

  deps.currentFloorMaterialRef.current = deps.config.floorMaterial;

  const horizontalSpeed = Math.sqrt(vel.x * vel.x + vel.z * vel.z);
  const animPos = rb.translation();
  if (
    !airborneIntent &&
    animPos.y <= groundY + floorSlack &&
    Math.abs(vel.y) < 0.75
  ) {
    deps.isGroundedRef.current = true;
    if (Math.abs(vel.y) < 0.25) vel.y = 0;
  }
  if (!deps.isGroundedRef.current) {
    const clearlyAirborne = animPos.y > groundY + 0.08 || vel.y > 0.35;
    if (clearlyAirborne) {
      deps.currentAnimRef.current = vel.y > 0.5 ? 'jump' : 'fall';
    } else {
      deps.isGroundedRef.current = true;
      vel.y = 0;
    }
  } else if (
    horizontalSpeed > (scratch.isLocked ? 0.12 : 0.5)
  ) {
    deps.currentAnimRef.current = running ? 'run' : 'walk';
  } else {
    deps.currentAnimRef.current = 'idle';
  }

  if ((isMoving || horizontalSpeed > 0.5) && deps.isGroundedRef.current) {
    deps.footstepTimerRef.current += dt;
    const stepInterval = running ? FOOTSTEP_INTERVAL * 0.65 : FOOTSTEP_INTERVAL;
    if (deps.footstepTimerRef.current >= stepInterval) {
      deps.footstepTimerRef.current = 0;
      const pos = rb.translation();
      // Emit for future subscribers (NPC hearing, particle dust, etc.).
      // Currently no subscribers, but the event is the canonical "player
      // stepped here" signal — keep it for downstream systems.
      eventBus.emit('exploration:footstep', {
        position: [pos.x, pos.y, pos.z],
        yaw: deps.livePlayerRotationRef.current,
      });
      audioEngine.playFootstep(deps.currentFloorMaterialRef.current, {
        sourceId: 'player-footstep',
      });
    }
  } else {
    deps.footstepTimerRef.current = 0;
  }

  let finalPos = rb.translation();
  const finalGroundY = groundY;

  const floorSnapEps = isOutdoor ? 0.02 : 0.008;
  if (
    onFlatGround &&
    !isGroundedNow &&
    Math.abs(finalPos.y - finalGroundY) > floorSnapEps
  ) {
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
