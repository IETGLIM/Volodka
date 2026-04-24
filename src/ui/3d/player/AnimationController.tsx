'use client';

/**
 * Точка входа для логики анимации/презентации обхода (шаг 4): выбор клипов GLB и шаг поворота визуала
 * вынесены в `game/simulation` (`explorationGlbAnimation`, `explorationMovementPresentation`).
 * Root motion по-прежнему снимается в `lib/stripExplorationPlayerRootMotionFromClips`.
 */
export {
  explorationGlbSingleClipTimeScale,
  planExplorationGlbLocomotionClip,
} from '@/game/simulation/explorationGlbAnimation';
export {
  computeMoveActiveFromHorizontalSpeed,
  introCutsceneLocomotionFlags,
  stepExplorationVisualYawTowardVelocity,
} from '@/game/simulation/explorationMovementPresentation';
