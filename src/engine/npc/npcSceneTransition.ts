/* ─── Volodka RPG – NPC Scene Transition Helpers ─── */
/* Функции для расчёта точек выхода/входа и запуска анимаций перехода.
 * Система является аддитивной — NPC без расписания продолжают работать как раньше.
 *
 * Точки выхода рассчитываются по размерам сцены (4 ребра):
 *   [±width/2, 0, ±depth/2].  Выбирается ближайшее к NPC ребро.
 *
 * Точка входа — противоположная сторона от целевой позиции.
 */

import { Vector3 } from 'three';
import { eventBus } from '@/engine/EventBus';
import { getSceneConfig } from '@/config/scenes';
import type { SceneId } from '@/config/sceneIds';

/* ─── Константы ─── */

/** Максимальное время выхода в секундах (таймаут). */
export const EXIT_TIMEOUT_S = 3.0;

/** Скорость ходьбы NPC при переходе (ед./с). */
export const TRANSITION_WALK_SPEED = 1.5;

/** Расстояние, при котором NPC считается прибывшим. */
export const ARRIVAL_THRESHOLD = 0.15;

/* ─── Публичные типы (используются NpcTransitionAnimator) ─── */

export type TransitionKind = 'exit' | 'entry';

export interface NpcTransitionState {
  npcId: string;
  kind: TransitionKind;
  sceneId: SceneId;
  /** Текущая позиция (модифицируется каждый кадр). */
  current: Vector3;
  /** Целевая позиция (край сцены при выходе, schedule-позиция при входе). */
  target: Vector3;
  /** Текущий угол поворота вокруг Y (рад). */
  rotationY: number;
  /** Целевой угол поворота (для плавного поворота). */
  targetRotationY: number;
  /** Таймер таймаута (секунды). */
  timeout: number;
}

/* ─── Вспомогательные функции ─── */

/**
 * Вычислить 4 точки на краях сцены по размерам из конфигурации.
 * Возвращает массив из 4 точек: [±w/2, 0, ±d/2].
 */
export function getSceneEdgePoints(sceneId: SceneId): [number, number, number][] {
  const config = getSceneConfig(sceneId);
  const [width, depth] = config.size;
  const hw = width / 2;
  const hd = depth / 2;
  return [
    [-hw, 0, 0],   // левый край
    [hw, 0, 0],    // правый край
    [0, 0, -hd],   // задний край
    [0, 0, hd],    // передний край
  ];
}

/**
 * Найти ближайшую к NPC точку выхода из сцены.
 * Выбирается ближайшее из 4 рёбер сцены.
 */
export function computeNearestExitPoint(
  npcPos: [number, number, number],
  sceneId: SceneId,
): [number, number, number] {
  const edges = getSceneEdgePoints(sceneId);
  let bestDist = Infinity;
  let bestPoint: [number, number, number] = edges[0];

  for (const edge of edges) {
    const dx = edge[0] - npcPos[0];
    const dz = edge[2] - npcPos[2];
    const dist = dx * dx + dz * dz;
    if (dist < bestDist) {
      bestDist = dist;
      bestPoint = edge;
    }
  }

  return bestPoint;
}

/**
 * Вычислить точку появления на краю сцены — противоположную
 * сторону от целевой позиции.
 */
export function computeEntryPoint(
  targetPosition: [number, number, number],
  sceneId: SceneId,
): [number, number, number] {
  const config = getSceneConfig(sceneId);
  const [width, depth] = config.size;
  const hw = width / 2;
  const hd = depth / 2;

  const edges: [number, number, number][] = [
    [-hw, 0, 0],
    [hw, 0, 0],
    [0, 0, -hd],
    [0, 0, hd],
  ];

  let bestDist = -1;
  let bestPoint: [number, number, number] = edges[0];

  for (const edge of edges) {
    const dx = edge[0] - targetPosition[0];
    const dz = edge[2] - targetPosition[2];
    const dist = dx * dx + dz * dz;
    if (dist > bestDist) {
      bestDist = dist;
      bestPoint = edge;
    }
  }

  return bestPoint;
}

/**
 * Запустить анимацию выхода NPC из сцены.
 * NpcTransitionAnimator перехватит событие и начнёт перемещение.
 */
export function triggerNpcExit(npcId: string, sceneId: SceneId): void {
  eventBus.emit('npc:exit_start', { npcId, sceneId });
}

/**
 * Запустить анимацию входа NPC в сцену.
 * NPC появится на краю и пойдёт к целевой позиции.
 */
export function triggerNpcEntry(
  npcId: string,
  targetPosition: [number, number, number],
  sceneId: SceneId,
): void {
  eventBus.emit('npc:entry_start', { npcId, targetPosition, sceneId });
}

/**
 * Рассчитать угол поворота (Y) для взгляда от текущей позиции к целевой.
 */
export function calculateTransitionRotationY(
  from: Vector3,
  to: Vector3,
): number {
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  return Math.atan2(dx, dz);
}

/**
 * Плавная интерполяция угла с нормализацией в [-PI, PI].
 */
export function lerpRotationY(current: number, target: number, t: number): number {
  let diff = target - current;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return current + diff * t;
}

/**
 * Продвинуть состояние перехода на один кадр.
 * Возвращает true, если переход завершён.
 */
export function advanceTransition(
  state: NpcTransitionState,
  delta: number,
): boolean {
  // Обновить таймаут
  state.timeout -= delta;
  if (state.timeout <= 0) {
    return true;
  }

  // Вектор к цели
  const dx = state.target.x - state.current.x;
  const dz = state.target.z - state.current.z;
  const dist = Math.sqrt(dx * dx + dz * dz);

  // Проверка прибытия
  if (dist < ARRIVAL_THRESHOLD) {
    state.current.copy(state.target);
    state.rotationY = state.targetRotationY;
    return true;
  }

  // Перемещение к цели
  const moveDist = Math.min(TRANSITION_WALK_SPEED * delta, dist);
  const dirX = dx / dist;
  const dirZ = dz / dist;
  state.current.x += dirX * moveDist;
  state.current.z += dirZ * moveDist;

  // Обновить целевой угол поворота
  state.targetRotationY = Math.atan2(dirX, dirZ);

  // Плавный поворот
  const rotLerp = 1 - Math.exp(-4.0 * delta);
  state.rotationY = lerpRotationY(state.rotationY, state.targetRotationY, rotLerp);

  return false;
}

/** Очистить все активные переходы (тесты / смена сцены). */
export function clearAllTransitions(map: Map<string, NpcTransitionState>): void {
  map.clear();
}
