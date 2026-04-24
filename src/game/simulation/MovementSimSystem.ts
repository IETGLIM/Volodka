/**
 * Параллель по смыслу с `ecs/sim/MovementSimSystem` (пакетная интеграция SoA в ECS),
 * но для TPS-обхода: чистые функции презентации и гистерезиса после шага Rapier KCC.
 * См. также `engine/physics/KCC.ts` и `PhysicsPlayer`.
 */
export {
  computeMoveActiveFromHorizontalSpeed,
  EXPLORATION_MOVE_SPEED_ENTER,
  EXPLORATION_MOVE_SPEED_EXIT,
  introCutsceneLocomotionFlags,
  INTRO_CUTSCENE_RUN_SPEED,
  INTRO_CUTSCENE_WALK_SPEED,
  stepExplorationVisualYawTowardVelocity,
} from './explorationMovementPresentation';
