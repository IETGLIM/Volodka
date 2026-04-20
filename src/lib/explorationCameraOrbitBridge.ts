/**
 * Горизонтальный yaw орбиты камеры обхода (тот же угол, что `FollowCamera` → `sin(yaw)/cos(yaw)` для смещения).
 * Пишется в `useFrame` камеры; читается в `useBeforePhysicsStep` игрока (предыдущий кадр — нормально для WASD относительно вида).
 */
let explorationCameraOrbitYawRad = 0;

export function setExplorationCameraOrbitYawRad(y: number): void {
  if (Number.isFinite(y)) {
    explorationCameraOrbitYawRad = y;
  }
}

/** Текущий горизонтальный угол орбиты камеры (рад). */
export function getExplorationCameraOrbitYawRad(): number {
  return explorationCameraOrbitYawRad;
}
