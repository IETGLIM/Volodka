import type { RapierCharacterController } from '@/engine/physics/rapierTypes';

type WorldWithOptionalControllerRemove = {
  removeCharacterController?: (controller: RapierCharacterController) => void;
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
