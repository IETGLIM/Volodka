/* ─── Volodka RPG – NPC Transition Animator ─── */
/* Компонент прослушивает события npc:exit_start / npc:entry_start
 * и покадрово перемещает NPC к краю (выход) или от края к цели (вход).
 *
 * Активные переходы хранятся в модульном Map — один экземпляр компонента
 * на сцену. Позиция NPC перезаписывается через group ref из npcRegistry,
 * что позволяет работать без модификации существующих NPC-компонентов.
 */

import { useEffect, useRef } from 'react';
import { Vector3 } from 'three';
import { eventBus } from '@/engine/EventBus';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import { getNPCGroup } from '@/engine/interaction/npcRegistry';
import {
  type NpcTransitionState,
  computeNearestExitPoint,
  computeEntryPoint,
  calculateTransitionRotationY,
  advanceTransition,
  EXIT_TIMEOUT_S,
} from '@/engine/npc/npcSceneTransition';

/* ─── Модульное хранилище активных переходов ─── */

const activeTransitions = new Map<string, NpcTransitionState>();

/** Получить текущие переходы (для отладки / тестов). */
export function getActiveTransitionCount(): number {
  return activeTransitions.size;
}

/** Очистить все переходы (HMR / смена сцены). */
export function resetTransitionAnimator(): void {
  activeTransitions.clear();
}

/* ─── Компонент ─── */

/**
 * Монтируется один раз в 3D-сцене рядом с NPCSystem.
 * Слушает события переходов и покадрово анимирует позиции NPC.
 */
export function NpcTransitionAnimator(): null {
  const mountedRef = useRef(true);

  // Подписка на события переходов
  useEffect(() => {
    mountedRef.current = true;

    const unsubExit = eventBus.on('npc:exit_start', (payload) => {
      if (!mountedRef.current) return;
      startExitTransition(payload.npcId, payload.sceneId);
    });

    const unsubEntry = eventBus.on('npc:entry_start', (payload) => {
      if (!mountedRef.current) return;
      startEntryTransition(
        payload.npcId,
        payload.targetPosition,
        payload.sceneId,
      );
    });

    return () => {
      mountedRef.current = false;
      unsubExit();
      unsubEntry();
      activeTransitions.clear();
    };
  }, []);

  // Покадровое обновление (приоритет 1 — после NpcFrameBatchRunner с приоритетом 0)
  useFrameTick(
    'npc',
    ({ delta }) => {
      const dt = Math.min(delta, 0.05);
      const toRemove: string[] = [];

      for (const [npcId, state] of activeTransitions) {
        const group = getNPCGroup(npcId);
        if (!group) {
          // NPC не найден в реестре — завершить переход
          toRemove.push(npcId);
          continue;
        }

        const completed = advanceTransition(state, dt);

        // Применить позицию и поворот к группе NPC
        group.position.set(state.current.x, state.current.y, state.current.z);
        group.rotation.y = state.rotationY;

        if (completed) {
          toRemove.push(npcId);
          if (state.kind === 'exit') {
            eventBus.emit('npc:despawn', { npcId });
          } else {
            eventBus.emit('npc:entry_complete', { npcId });
          }
        }
      }

      for (const npcId of toRemove) {
        activeTransitions.delete(npcId);
      }
    },
    { label: 'NpcTransitionAnimator', priority: 1 },
  );

  return null;
}

/* ─── Внутренние функции ─── */

/**
 * Запустить переход выхода: NPC идёт к ближайшему краю сцены.
 */
function startExitTransition(npcId: string, sceneId: string): void {
  // Не перезапускать активный переход для того же NPC
  if (activeTransitions.has(npcId)) return;

  const group = getNPCGroup(npcId);
  if (!group) return;

  const currentPos: [number, number, number] = [
    group.position.x,
    group.position.y,
    group.position.z,
  ];

  const exitPoint = computeNearestExitPoint(currentPos, sceneId as NpcTransitionState['sceneId']);
  const target = new Vector3(exitPoint[0], exitPoint[1], exitPoint[2]);
  const current = new Vector3(currentPos[0], currentPos[1], currentPos[2]);

  const targetRot = calculateTransitionRotationY(current, target);

  activeTransitions.set(npcId, {
    npcId,
    kind: 'exit',
    sceneId: sceneId as NpcTransitionState['sceneId'],
    current,
    target,
    rotationY: group.rotation.y,
    targetRotationY: targetRot,
    timeout: EXIT_TIMEOUT_S,
  });
}

/**
 * Запустить переход входа: NPC появляется на краю и идёт к цели.
 */
function startEntryTransition(
  npcId: string,
  targetPosition: [number, number, number],
  sceneId: string,
): void {
  // Не перезапускать активный переход для того же NPC
  if (activeTransitions.has(npcId)) return;

  const group = getNPCGroup(npcId);
  if (!group) return;

  const entryPoint = computeEntryPoint(targetPosition, sceneId as NpcTransitionState['sceneId']);
  const target = new Vector3(targetPosition[0], targetPosition[1], targetPosition[2]);
  const current = new Vector3(entryPoint[0], entryPoint[1], entryPoint[2]);

  // Сразу переместить NPC к точке появления
  group.position.set(current.x, current.y, current.z);

  const targetRot = calculateTransitionRotationY(current, target);

  activeTransitions.set(npcId, {
    npcId,
    kind: 'entry',
    sceneId: sceneId as NpcTransitionState['sceneId'],
    current,
    target,
    rotationY: group.rotation.y,
    targetRotationY: targetRot,
    timeout: EXIT_TIMEOUT_S,
  });
}
