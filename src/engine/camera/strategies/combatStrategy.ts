import { isEncounterPresentationActive } from '@/engine/combat/encounterPresentation';
import {
  updateCombatCamera,
  updateExplorationState,
  resolveCameraCollision,
} from '../cinematicCamera';
import { LOOK_HEIGHT, MIN_DISTANCE, WALL_MARGIN } from '../cameraConstants';
import type { CameraModeContext, CameraModeStrategy } from '../types';

/** Wide FOV combat camera with impact zoom and shake */
export const combatStrategy: CameraModeStrategy = {
  id: 'combat',
  priority: 60,

  isActive(ctx) {
    return ctx.gameMode === 'combat' || isEncounterPresentationActive();
  },

  update(ctx) {
    const combat = ctx.combat;
    if (!combat) return null;

    const { playerPos, yaw, pitch, interactionDistance, offset, desiredPos, lookTarget } = ctx;

    offset.set(
      Math.sin(yaw) * Math.cos(pitch),
      Math.sin(pitch),
      Math.cos(yaw) * Math.cos(pitch),
    ).multiplyScalar(interactionDistance * 1.15);

    let targetPos = desiredPos.set(
      playerPos.x + offset.x,
      playerPos.y + LOOK_HEIGHT + offset.y,
      playerPos.z + offset.z,
    );
    const targetLook = lookTarget.set(playerPos.x, playerPos.y + LOOK_HEIGHT, playerPos.z);

    targetPos = resolveCameraCollision(
      ctx.raycaster,
      ctx.sceneChildren,
      targetLook,
      targetPos,
      WALL_MARGIN,
      MIN_DISTANCE,
    );

    const combatResult = updateCombatCamera(combat, ctx.delta, ctx.spring.position);
    const shakenPos = ctx.tempVec2.copy(targetPos).add(combatResult.shakeOffset);

    let targetRoll = 0;
    const exploration = ctx.exploration;
    if (exploration) {
      const expResult = updateExplorationState(
        exploration,
        playerPos,
        yaw,
        ctx.playerVelocity,
        ctx.delta,
        ctx.moveBlend,
      );
      targetRoll = expResult.targetRoll * 0.5;
    }

    return {
      kind: 'targets',
      mode: 'combat',
      targets: {
        targetPos: shakenPos,
        targetLook,
        targetFov: combatResult.effectiveFov,
        targetRoll,
      },
    };
  },
};
