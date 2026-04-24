/**
 * Экспоненциальное сглаживание для `FollowCamera` / `SimpleFollowCamera` (без зависимости от R3F).
 * Формула: `1 - exp(-λ·Δt)`.
 */

export function followCameraSmoothDamp(smoothness: number, delta: number): number {
  /** Чуть выше λ — камера догоняет цель заметно увереннее (TPS / коллизии без «ваты»). */
  const lambda = 2.75 + smoothness * 56;
  return 1 - Math.exp(-lambda * delta);
}

export function followCameraCollisionDamp(collisionSpring: number, delta: number): number {
  return 1 - Math.exp(-collisionSpring * delta);
}
