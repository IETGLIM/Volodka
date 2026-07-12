import type { RapierCharacterController } from '@/engine/physics/rapierTypes';
import {
  SKIN_WIDTH,
  MAX_SLOPE_CLIMB,
  MIN_SLOPE_SLIDE,
  AUTOSTEP_HEIGHT,
  AUTOSTEP_WIDTH,
  SNAP_DISTANCE,
} from '@/engine/player/playerConstants';

type WorldWithOptionalControllerRemove = {
  removeCharacterController?: (controller: RapierCharacterController) => void;
  createCharacterController: (offset: number) => RapierCharacterController;
};

type CharacterControllerWithOptionalFree = RapierCharacterController & {
  free?: () => void;
};

/** Release KCC across Rapier builds (world.remove vs controller.free vs world teardown). */
export function disposeCharacterController(
  world: WorldWithOptionalControllerRemove,
  controller: RapierCharacterController,
): void {
  if (typeof world.removeCharacterController === 'function') {
    world.removeCharacterController(controller);
    return;
  }
  const free = (controller as CharacterControllerWithOptionalFree).free;
  if (typeof free === 'function') {
    free.call(controller);
  }
}

/** Create a player KCC with the standard slope/step/snap tuning. */
export function createConfiguredCharacterController(
  world: WorldWithOptionalControllerRemove,
  skinWidth: number = SKIN_WIDTH,
): RapierCharacterController {
  const controller = world.createCharacterController(skinWidth);
  controller.setUp({ x: 0, y: 1, z: 0 });
  controller.setMaxSlopeClimbAngle(MAX_SLOPE_CLIMB);
  controller.setMinSlopeSlideAngle(MIN_SLOPE_SLIDE);
  controller.enableAutostep(AUTOSTEP_HEIGHT, AUTOSTEP_WIDTH, true);
  controller.enableSnapToGround(SNAP_DISTANCE);
  controller.setSlideEnabled(true);
  controller.setApplyImpulsesToDynamicBodies(false);
  controller.setCharacterMass(75);
  controller.setNormalNudgeFactor(0.12);
  return controller;
}

/** Dispose the current controller (if any) and create a fresh one. */
export function recreateCharacterController(
  world: WorldWithOptionalControllerRemove,
  current: RapierCharacterController | null,
  skinWidth: number = SKIN_WIDTH,
): RapierCharacterController {
  if (current) {
    disposeCharacterController(world, current);
  }
  return createConfiguredCharacterController(world, skinWidth);
}
