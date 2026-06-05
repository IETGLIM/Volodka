import * as THREE from 'three';
import { updateCutsceneController } from '../cinematicCamera';
import { LOOK_HEIGHT } from '../cameraConstants';
import type { CameraModeContext, CameraModeStrategy } from '../types';

function computeOrbitFallback(ctx: CameraModeContext) {
  const { playerPos, yaw, pitch, interactionDistance, offset, desiredPos, lookTarget } = ctx;
  offset.set(
    Math.sin(yaw) * Math.cos(pitch),
    Math.sin(pitch),
    Math.cos(yaw) * Math.cos(pitch),
  ).multiplyScalar(interactionDistance);

  const targetPos = desiredPos.set(
    playerPos.x + offset.x,
    playerPos.y + LOOK_HEIGHT + offset.y,
    playerPos.z + offset.z,
  );
  const targetLook = lookTarget.set(playerPos.x, playerPos.y + LOOK_HEIGHT, playerPos.z);

  return {
    targetPos,
    targetLook,
    targetFov: ctx.currentSceneFov,
    targetRoll: 0,
  };
}

/** NPC interaction intro cutscene */
export const npcCutsceneStrategy: CameraModeStrategy = {
  id: 'npc_cutscene',
  priority: 90,

  isActive(ctx) {
    return ctx.npcCutsceneActive && ctx.npcCutscene !== null;
  },

  update(ctx) {
    const controller = ctx.npcCutscene;
    if (!controller) return null;

    const cutsceneResult = updateCutsceneController(controller, ctx.delta);
    if (cutsceneResult) {
      return {
        kind: 'targets',
        mode: 'npc_cutscene',
        targets: {
          targetPos: cutsceneResult.position,
          targetLook: cutsceneResult.lookAt,
          targetFov: cutsceneResult.fov,
          targetRoll: 0,
        },
      };
    }

    ctx.npcCutsceneActive = false;
    return {
      kind: 'targets',
      mode: 'npc_cutscene',
      targets: computeOrbitFallback(ctx),
    };
  },
};

/** Story waypoint cutscene */
export const cutsceneStrategy: CameraModeStrategy = {
  id: 'cutscene',
  priority: 80,

  isActive(ctx) {
    return ctx.gameMode === 'cutscene' && ctx.cutsceneActive && ctx.cutscene !== null;
  },

  update(ctx) {
    const controller = ctx.cutscene;
    if (!controller) return null;

    const cutsceneResult = updateCutsceneController(controller, ctx.delta);
    if (cutsceneResult) {
      return {
        kind: 'targets',
        mode: 'cutscene',
        targets: {
          targetPos: cutsceneResult.position,
          targetLook: cutsceneResult.lookAt,
          targetFov: cutsceneResult.fov,
          targetRoll: 0,
        },
      };
    }

    ctx.cutsceneActive = false;
    return {
      kind: 'targets',
      mode: 'cutscene',
      targets: computeOrbitFallback(ctx),
    };
  },
};
