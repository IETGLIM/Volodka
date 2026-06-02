/**
 * Rapier kinematic character controller (KCC) для обхода: фабрика контроллера и интеграция шага.
 * Детали интеграции — в `CharacterController.ts`; здесь единая точка импорта для геймплей-кода.
 */
export {
  /** @see `CharacterController.ts` */
  applyGroundingAfterCharacterProbe,
  /** @see `CharacterController.ts` */
  clampPhysicsTimestep,
  /** @see `CharacterController.ts` */
  computePlayerCapsule,
  /** @see `CharacterController.ts` */
  createExplorationKinematicCharacterController,
  /** @see `CharacterController.ts` */
  integrateKinematicLocomotionDelta,
} from './CharacterController';

export type {
  /** @see `CharacterController.ts` */
  CharacterControllerWorld,
  /** @see `CharacterController.ts` */
  MovementModifiers,
  /** @see `CharacterController.ts` */
  MutableBoolRef,
  /** @see `CharacterController.ts` */
  MutableScalarRef,
} from './CharacterController';
