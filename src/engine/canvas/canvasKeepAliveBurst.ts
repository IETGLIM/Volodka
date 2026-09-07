/* ─── Volodka RPG – событийные окна пробуждения для demand-фреймлупа ─── */
/* Аудит этап 64: слепой keep-alive-интервал (invalidate каждые 2 с) пере-
 * рисовывал 3D-сцену даже там, где кадры никому не нужны — в меню/интро
 * канвас CSS-скрыт (visibility: hidden в OrchestratorCanvasLayer), в скрытой
 * вкладке rAF не срабатывает, а за story-оверлеем мир статичен намеренно.
 * Модуль заменяет интервал на «пробуждение по спросу»: события, которые
 * реально анимируют мир за открытым диалоговым оверлеем (переходы NPC,
 * жесты, эмоции, квест-маркеры), открывают короткое полно-FPS окно.
 * Окно — цепочка rAF с дедлайном: самозавершается, когда анимация
 * закончилась; вне окон кадры не запрашиваются вовсе. */

import { eventBus, type EventName } from '@/engine/EventBus';
import { EXIT_TIMEOUT_S } from '@/engine/npc/npcSceneTransition';

/** Окно для переходов NPC: худший случай EXIT_TIMEOUT_S (3 с) + запас на blend. */
export const NPC_TRANSITION_BURST_MS = EXIT_TIMEOUT_S * 1000 + 500;

/** Короткое окно для мгновенных смен состояния (жест, эмоция, квест-маркер). */
export const GESTURE_BURST_MS = 700;

/** События → длительность окна пробуждения (мс). Канонический реестр. */
const BURST_EVENTS: ReadonlyArray<{ event: EventName; durationMs: number }> = [
  { event: 'npc:entry_start', durationMs: NPC_TRANSITION_BURST_MS },
  { event: 'npc:exit_start', durationMs: NPC_TRANSITION_BURST_MS },
  { event: 'npc:animation', durationMs: GESTURE_BURST_MS },
  { event: 'npc:emotion_triggered', durationMs: GESTURE_BURST_MS },
  { event: 'quest:pulse_marker', durationMs: GESTURE_BURST_MS },
];

export interface KeepAliveBurstOptions {
  /** true, пока story-оверлей держит канвас в demand-режиме. */
  isStaticScreen: () => boolean;
  /** r3f invalidate — рендерит один кадр в demand-режиме. */
  invalidate: () => void;
  /** Планировщик кадра (инъекция для тестов; по умолчанию requestAnimationFrame). */
  scheduleFrame?: (callback: () => void) => number;
  /** Отмена кадра (инъекция для тестов; по умолчанию cancelAnimationFrame). */
  cancelFrame?: (id: number) => void;
  /** Часы (инъекция для тестов; по умолчанию performance.now). */
  now?: () => number;
}

export interface KeepAliveBurstHandle {
  /** Отписаться от событий и погасить незавершённую цепочку кадров. */
  dispose(): void;
}

/**
 * Запускает слушатель окон пробуждения. Возвращает дескриптор для dispose.
 * Побочных таймеров не создаёт: вне событий и вне активного окна процессор
 * не тратится вообще (никаких setInterval).
 */
export function startKeepAliveBurst(options: KeepAliveBurstOptions): KeepAliveBurstHandle {
  const {
    isStaticScreen,
    invalidate,
    scheduleFrame = (cb) => requestAnimationFrame(cb),
    cancelFrame = (id) => cancelAnimationFrame(id),
    now = () => performance.now(),
  } = options;

  let frameId: number | null = null;
  let burstDeadline = 0;
  let disposed = false;

  const tickBurst = (): void => {
    frameId = null;
    if (disposed) return;
    // В 'always'-режиме кадры идут и без нас — пробуждение не нужно.
    if (!isStaticScreen()) return;
    invalidate();
    if (now() < burstDeadline) {
      frameId = scheduleFrame(tickBurst);
    }
  };

  const scheduleBurst = (durationMs: number): void => {
    if (disposed) return;
    // Перекрывающиеся события расширяют окно, а не перезапускают его.
    burstDeadline = Math.max(burstDeadline, now() + durationMs);
    if (frameId === null) {
      frameId = scheduleFrame(tickBurst);
    }
  };

  const unsubs = BURST_EVENTS.map(({ event, durationMs }) =>
    eventBus.on(event, () => scheduleBurst(durationMs)),
  );

  return {
    dispose(): void {
      if (disposed) return;
      disposed = true;
      for (const unsub of unsubs) unsub();
      if (frameId !== null) {
        cancelFrame(frameId);
        frameId = null;
      }
      burstDeadline = 0;
    },
  };
}
