/**
 * Диагностика мерцания: тот же **`RigidBody`** + KinematicCharacterController, но вместо GLB — простой меш.
 *
 * Включение: **`NEXT_PUBLIC_EXPLORATION_PLAYER_DEBUG_PRIMITIVE=1`** в `.env.local`, пересборка.
 * Если мерцание исчезло — смотреть визуал/материалы GLB; если нет — физика / коллайдеры сцены.
 */
export function isExplorationPlayerDebugPrimitiveEnabled(): boolean {
  return process.env.NEXT_PUBLIC_EXPLORATION_PLAYER_DEBUG_PRIMITIVE === '1';
}
