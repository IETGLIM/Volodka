import { useCallback, useSyncExternalStore } from 'react';

/* ─── Volodka RPG – общий UI-clock (FIX perf v4.23, этап 91) ───
 *
 * Раньше каждая панель держала СВОЙ setInterval для обратных отсчётов:
 * PoemJournalPanel (1с), PoemsTab (500мс, локальный дубликат хука),
 * usePoemCooldownSeconds (500мс) — N открытых панелей = N интервалов,
 * каждый со своим ре-рендером и своим сдвигом фазы.
 *
 * Теперь один общий тикер на частоту: подписчики регистрируются через
 * useSyncExternalStore, интервал запускается только когда есть хотя бы
 * один подписчик данной частоты и гасится, когда последний уходит.
 * Тик пропускается в скрытой вкладке (document.hidden) — по возврату
 * видимости делается финальный бамп, чтобы отсчёты не «застывали».
 */

type TickListener = () => void;

const listenersByPeriod = new Map<number, Set<TickListener>>();
const intervalsByPeriod = new Map<number, ReturnType<typeof setInterval>>();
const versionsByPeriod = new Map<number, number>();

function bump(periodMs: number): void {
  const prev = versionsByPeriod.get(periodMs) ?? 0;
  versionsByPeriod.set(periodMs, prev + 1);
  const listeners = listenersByPeriod.get(periodMs);
  if (listeners) {
    for (const listener of listeners) listener();
  }
}

function startTicker(periodMs: number): void {
  if (intervalsByPeriod.has(periodMs)) return;
  intervalsByPeriod.set(
    periodMs,
    setInterval(() => {
      // В скрытой вкладке браузер и так троттлит интервалы до ~1Гц;
      // пропускаем тики, чтобы не копить очередь после возврата.
      if (typeof document !== 'undefined' && document.hidden) return;
      bump(periodMs);
    }, periodMs),
  );

  // Возврат видимости — догоняющий тик (отсчёты не застывают).
  if (typeof document !== 'undefined') {
    document.addEventListener(
      'visibilitychange',
      () => {
        if (!document.hidden) bump(periodMs);
      },
    );
  }
}

function stopTicker(periodMs: number): void {
  const iv = intervalsByPeriod.get(periodMs);
  if (iv !== undefined) {
    clearInterval(iv);
    intervalsByPeriod.delete(periodMs);
  }
}

function subscribeTick(periodMs: number, listener: TickListener): () => void {
  let listeners = listenersByPeriod.get(periodMs);
  if (!listeners) {
    listeners = new Set();
    listenersByPeriod.set(periodMs, listeners);
  }
  listeners.add(listener);
  startTicker(periodMs);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      listenersByPeriod.delete(periodMs);
      stopTicker(periodMs);
    }
  };
}

function getVersion(periodMs: number): number {
  return versionsByPeriod.get(periodMs) ?? 0;
}

/**
 * Общий тик UI-панелей. Возвращает монотонно растущий счётчик, который
 * обновляется каждые `periodMs`, пока компонент смонтирован.
 *
 * `periodMs = 0` — подписки нет (компонент «выключен», например закрытая
 * панель): хук возвращает константу и не создаёт интервалов.
 *
 * Использование: `const tick = useUiTick(open ? 1000 : 0);` и включить
 * `tick` в зависимости мемо/расчётов, зависящих от текущего времени.
 */
export function useUiTick(periodMs: number): number {
  // Стабильные subscribe/getSnapshot: при неизменном периоде React не
  // переразывается подписка на каждом рендере.
  const subscribe = useCallback(
    (onStoreChange: TickListener) => subscribeTick(periodMs, onStoreChange),
    [periodMs],
  );
  const getSnapshot = useCallback(() => getVersion(periodMs), [periodMs]);
  return useSyncExternalStore(subscribe, getSnapshot, () => 0);
}
