import { clampPhysicsTimestep } from '@/engine/physics/KCC';
import type { PlayerControls } from '@/engine/input/playerControlsTypes';

/** Гистерезис горизонтальной скорости: «вошли в движение» / «вышли в idle». */
export const EXPLORATION_MOVE_SPEED_ENTER = 0.14;
export const EXPLORATION_MOVE_SPEED_EXIT = 0.055;

/** Пороги анимации в интро-кат-сцене (м/с по горизонтали). */
export const INTRO_CUTSCENE_WALK_SPEED = 0.12;
export const INTRO_CUTSCENE_RUN_SPEED = 2.35;

export function computeMoveActiveFromHorizontalSpeed(
  speed: number,
  wasActive: boolean,
): boolean {
  return wasActive ? speed > EXPLORATION_MOVE_SPEED_EXIT : speed > EXPLORATION_MOVE_SPEED_ENTER;
}

export function introCutsceneLocomotionFlags(horizontalSpeed: number): { walk: boolean; run: boolean } {
  return {
    walk: horizontalSpeed > INTRO_CUTSCENE_WALK_SPEED,
    run: horizontalSpeed > INTRO_CUTSCENE_RUN_SPEED,
  };
}

/**
 * Плавный поворот визуала к направлению горизонтальной скорости (см. комментарий в `PhysicsPlayer` useFrame).
 */
export function stepExplorationVisualYawTowardVelocity(input: {
  prevYaw: number;
  hx: number;
  hz: number;
  controls: PlayerControls;
  frameDeltaSec: number;
  /** Экспоненциальный коэффициент сглаживания (чем выше — быстрее догон). */
  yawBlendRate?: number;
}): number {
  const { prevYaw, hx, hz, controls, frameDeltaSec, yawBlendRate = 9 } = input;
  const backNoForward = controls.backward && !controls.forward;
  let targetRotation = Math.atan2(hx, hz);
  if (backNoForward) {
    targetRotation = Math.atan2(-hx, -hz);
  }
  let diff = targetRotation - prevYaw;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  const dt = clampPhysicsTimestep(frameDeltaSec);
  const blend = 1 - Math.exp(-yawBlendRate * dt);
  return prevYaw + diff * blend;
}
