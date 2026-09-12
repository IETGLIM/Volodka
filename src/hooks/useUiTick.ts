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

/* FIX (v4.25, этап 104): раньше visibilitychange добавлялся при КАЖДОМ
 * startTicker и никогда не снимался — панели, открываясь/закрываясь,
 * накапливали листенеры (утечка + лишние бампы). Теперь он вешается
 * один раз на модуль и живёт всё время существования реестра. */
let visibilityListenerAttached = false;
function ensureVisibilityListener(): void {
  if (visibilityListenerAttached || typeof document === 'undefined') return;
  visibilityListenerAttached = true;
  document.addEventListener(
    'visibilitychange',
    () => {
      if (!document.hidden) {
        // Догоняющий бамп всем активным периодам — отсчёты не «застывают».
        for (const periodMs of Array.from(intervalsByPeriod.keys())) bump(periodMs);
      }
    },
  );
}

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
  ensureVisibilityListener();
  intervalsByPeriod.set(
    periodMs,
    setInterval(() => {
      // В скрытой вкладке браузер и так троттлит интервалы до ~1Гц;
      // пропускаем тики, чтобы не копить очередь после возврата.
      if (typeof document !== 'undefined' && document.hidden) return;
      bump(periodMs);
    }, periodMs),
  );
}

function stopTicker(periodMs: number): void {
  const iv = intervalsByPeriod.get(periodMs);
  if (iv !== undefined) {
    clearInterval(iv);
    intervalsByPeriod.delete(periodMs);
  }
}

function subscribeTick(periodMs: number, listener: TickListener): () => void {
  // FIX (v4.25, этап 104): период 0 (и нечисловые значения) — «выключенная»
  // подписка. Документация хука обещала «0 = подписки нет», но гарда не было:
  // useUiTick(open ? 1000 : 0) при закрытой панели запускал setInterval(…, 0) —
  // фактически busy-loop. Теперь подписка с периодом ≤0 — no-op.
  if (!Number.isFinite(periodMs) || periodMs <= 0) {
    return () => undefined;
  }
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

/* ─── Императивный API единого UI-clock (v4.25, этап 104) ───
 *
 * Хук выше — для реактивных подписок (ре-рендер). Но часть «холодных»
 * интервалов в проекте гоняет СВОИ setInterval только ради вызова функции:
 * поллер новостей (useCityNews, 3.5 мин), мировой тик (useWorldClock, 60 с),
 * погодные эффекты (10 с), тихий HUD (1 с). Каждый такой интервал:
 *   – тикал даже в скрытой вкладке (поллер сжигал серверлесс-вызовы),
 *   – не делил таймер с другими подписчиками той же частоты,
 *   – жил, пока жив компонент, даже если тики никому не нужны.
 *
 * onUiTick(periodMs, cb) подключает cb к общему тикеру той же механики:
 * один интервал на частоту, тики пропускаются в скрытой вкладке, по
 * возврату видимости — догоняющий бамп. Возврат — функция отписки.
 */
export function onUiTick(periodMs: number, callback: TickListener): () => void {
  return subscribeTick(periodMs, callback);
}

/** Тестовая точка — текущее число активных (запущенных) тикеров. */
export function activeUiTickersForTests(): number {
  return intervalsByPeriod.size;
}
