/**
 * Rapier kinematic character controller (KCC) для обхода: фабрика контроллера и интеграция шага.
 * Детали интеграции — в `CharacterController.ts`; здесь единая точка импорта для геймплей-кода.
 */
export {
  applyGroundingAfterCharacterProbe,
  clampPhysicsTimestep,
  computePlayerCapsule,
  createExplorationKinematicCharacterController,
  integrateKinematicLocomotionDelta,
} from './CharacterController';
