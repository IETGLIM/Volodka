/**
 * Флаги диагностики мерцания / коллайдеров / дубликатов мешей (обход).
 * Все через `NEXT_PUBLIC_*` — после изменения `.env.local` нужна пересборка дев-сервера.
 */

import type { SceneId } from '@/data/types';
import type { FinalVisualUniformStages } from '@/lib/explorationScalePipeline';

export function isExplorationRapierColliderDebugEnabled(): boolean {
  return process.env.NEXT_PUBLIC_EXPLORATION_RAPIER_DEBUG_COLLIDERS === '1';
}

/**
 * Один проход по сцене: `console.log(scene)`, `console.table` мешей (мир + `geometry` uuid),
 * `console.warn` при дубликатах (та же геометрия в той же позиции / то же имя в той же позиции).
 * См. **`explorationMeshWorldAudit`** и **`ExplorationMeshWorldAudit`**.
 */
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

/**
 * Throttled `console.info` of grounded / horizontal velocity / position from `PhysicsPlayer`
 * (NEXT_PUBLIC_EXPLORATION_PLAYER_LOCOMOTION_LOG=1, rebuild dev server).
 */
export function isExplorationPlayerLocomotionLogEnabled(): boolean {
  return process.env.NEXT_PUBLIC_EXPLORATION_PLAYER_LOCOMOTION_LOG === '1';
}

/**
 * Однократный/редкий `console.info` цепочки uniform GLB игрока (`GLBPlayerModel` в `PhysicsPlayer`):
 * bbox, `base`, множитель сцены, `applyExplorationPlayerGlobalVisualScale`, clamp, интро-кап.
 * Включение: **`NEXT_PUBLIC_EXPLORATION_PLAYER_GLB_SCALE_DEBUG=1`** (пересборка дев-сервера / preview).
 */
export function isExplorationPlayerGlbScaleDebugEnabled(): boolean {
  return process.env.NEXT_PUBLIC_EXPLORATION_PLAYER_GLB_SCALE_DEBUG === '1';
}

/**
 * В `volodka_room` отключить GLB NPC (только `FallbackNPCModel`) — явно
 * `NEXT_PUBLIC_EXPLORATION_VOLODKA_NPC_GLB=0` (пересборка). По умолчанию GLB **включён**,
 * чтобы прод не выглядел «пустым» без ручного флага на Vercel.
 */
export function isExplorationVolodkaRoomNpcGlbDisabled(): boolean {
  return process.env.NEXT_PUBLIC_EXPLORATION_VOLODKA_NPC_GLB === '0';
}

/**
 * Подробный лог этапов `computeFinalVisualUniform` (после смены модели / в `useEffect`).
 * **`NEXT_PUBLIC_EXPLORATION_SCALE_DEBUG=1`** — пересборка дев-сервера / preview.
 */
export function isExplorationScaleDebugEnabled(): boolean {
  return process.env.NEXT_PUBLIC_EXPLORATION_SCALE_DEBUG === '1';
}

export function debugExplorationScalePipeline(
  label: string,
  modelUrl: string,
  tuningSceneId: SceneId,
  stages: FinalVisualUniformStages,
): void {
  if (!isExplorationScaleDebugEnabled()) return;
  console.info(`[explorationScalePipeline debug] ${label}`, {
    modelUrl,
    tuningSceneId,
    ...stages,
  });
}
