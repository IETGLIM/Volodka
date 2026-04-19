/**
 * Флаги диагностики мерцания / коллайдеров / дубликатов мешей (обход).
 * Все через `NEXT_PUBLIC_*` — после изменения `.env.local` нужна пересборка дев-сервера.
 */

export function isExplorationRapierColliderDebugEnabled(): boolean {
  return process.env.NEXT_PUBLIC_EXPLORATION_RAPIER_DEBUG_COLLIDERS === '1';
}

/** Один проход `scene.traverse` + `console.table` (мировые позиции мешей). */
export function isExplorationMeshAuditEnabled(): boolean {
  return process.env.NEXT_PUBLIC_EXPLORATION_MESH_AUDIT === '1';
}

/**
 * Игрок без `RigidBody`: движение `group.position` + те же клавиши (локализация: мерцание от Rapier или нет).
 */
export function isExplorationNoclipEnabled(): boolean {
  return process.env.NEXT_PUBLIC_EXPLORATION_NOCLIP === '1';
}

export function isExplorationWebGlContextLogEnabled(): boolean {
  return process.env.NEXT_PUBLIC_EXPLORATION_WEBGL_CONTEXT_LOG === '1';
}
