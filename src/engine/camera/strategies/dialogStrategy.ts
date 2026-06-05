import {
  getDialogueShot,
  updateDialogueShotController,
  resolveCameraCollision,
  type DialogueSpeaker,
} from '../cinematicCamera';
import { MIN_DISTANCE, WALL_MARGIN } from '../cameraConstants';
import { getInteractionState, getInteractionTargetNPCId } from '@/components/3d/InteractionSystemBridge';
import { InteractionState } from '@/engine/interaction/interactionMachine';
import { getNPCGroup } from '@/engine/interaction/npcRegistry';
import type { CameraModeContext, CameraModeStrategy } from '../types';

function isInDialogueMode(): boolean {
  const state = getInteractionState();
  return (
    state === InteractionState.Dialogue ||
    state === InteractionState.Lock ||
    state === InteractionState.Align
  );
}

/** Speaker-aware cinematic dialogue shots */
export const dialogStrategy: CameraModeStrategy = {
  id: 'dialog',
  priority: 70,

  isActive() {
    return isInDialogueMode();
  },

  update(ctx) {
    const controller = ctx.dialogueController;
    if (!controller) return null;

    const interactionState = getInteractionState();
    const npcId = getInteractionTargetNPCId();
    const npcGroup = npcId ? getNPCGroup(npcId) : undefined;
    const npcPos = npcGroup
      ? npcGroup.position
      : ctx.fallbackNpcPos.copy(ctx.playerPos).add(ctx.tempVec.set(0, 0, 2));

    let speaker: DialogueSpeaker = 'unknown';
    if (interactionState === InteractionState.Dialogue) {
      speaker = controller.currentSpeaker;
    }

    const currentShot = updateDialogueShotController(
      controller,
      ctx.delta,
      speaker !== 'unknown' ? speaker : undefined,
      ctx.currentNodeId,
    );

    const shot = getDialogueShot(
      currentShot,
      ctx.playerPos,
      npcPos,
      npcGroup?.rotation.y,
    );

    const lookAtTarget = ctx.lookTarget.copy(shot.lookAt);
    const resolvedPos = resolveCameraCollision(
      ctx.raycaster,
      ctx.sceneChildren,
      lookAtTarget,
      shot.position,
      WALL_MARGIN,
      MIN_DISTANCE,
    );

    return {
      kind: 'targets',
      mode: 'dialog',
      targets: {
        targetPos: resolvedPos,
        targetLook: shot.lookAt,
        targetFov: shot.fov,
        targetRoll: 0,
      },
    };
  },
};
