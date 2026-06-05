import * as THREE from 'three';
import {
  updateExplorationState,
  resolveCameraCollision,
} from '../cinematicCamera';
import {
  LOOK_HEIGHT,
  MIN_DISTANCE,
  WALL_MARGIN,
  BREATHING_BOB_AMPLITUDE,
  BREATHING_BOB_SPEED,
  LOOK_AHEAD_STRENGTH,
  LOOK_AHEAD_LERP_SPEED,
} from '../cameraConstants';
import type { CameraModeContext, CameraModeStrategy } from '../types';

/** Default spring-based exploration camera with look-ahead and breathing bob */
export const explorationStrategy: CameraModeStrategy = {
  id: 'exploration',
  priority: 10,

  isActive() {
    return true;
  },

  update(ctx) {
    const effectiveDistance = ctx.interactionLocked
      ? ctx.interactionDistance
      : ctx.distance;

    const { playerPos, yaw, pitch, offset, desiredPos, lookTarget, playerVelocity } = ctx;

    offset.set(
      Math.sin(yaw) * Math.cos(pitch),
      Math.sin(pitch),
      Math.cos(yaw) * Math.cos(pitch),
    );
    offset.multiplyScalar(effectiveDistance);

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
      );
      targetRoll = expResult.targetRoll;
      heightOffset = expResult.targetHeight - playerPos.y;
    }

    ctx.prevVelocitySmooth.lerp(
      playerVelocity,
      1 - Math.exp(-LOOK_AHEAD_LERP_SPEED * ctx.delta),
    );
    const speed = ctx.prevVelocitySmooth.length();
    const lookAheadAmount = Math.min(speed * LOOK_AHEAD_STRENGTH, 0.3);
    const lookAheadDir = speed > 0.01
      ? ctx.prevVelocitySmooth.clone().normalize()
      : ctx.tempVec2.set(0, 0, 0);
    ctx.lookAheadOffset.copy(lookAheadDir).multiplyScalar(lookAheadAmount);

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

    if (!ctx.interactionLocked) {
      const breathBob = Math.sin(ctx.time * BREATHING_BOB_SPEED) * BREATHING_BOB_AMPLITUDE;
      targetPos.y += breathBob;
    }

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
        targetFov: ctx.currentSceneFov,
        targetRoll,
      },
    };
  },
};
