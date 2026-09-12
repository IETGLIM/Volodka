/* ─── Volodka RPG – LCP-профилировщик загрузки (v4.25, этап 106) ───
 *
 * LoadingTimeline уже ставит performance.mark по пути загрузки
 * (app-start → orchestrator-mount → game-data-ready → canvas-mounted →
 * first-frame → first-scene-playable), но не отвечает на главный
 * Core-Web-Vitals вопрос: когда браузер нарисовал КРУПНЕЙШИЙ элемент
 * стартового экрана (LCP) и не уехал ли он дальше «играбельной» сцены.
 *
 * Этот модуль подписывается на PerformanceObserver('largest-contentful-paint'):
 *   – buffered: true — ловит отрисовки, случившиеся ДО подписки;
 *   – LCP живёт до первого пользовательского ввода — мы снимаем последнее
 *     значение на момент завершения first-scene-playable;
 *   – в средах без поддержки типа (Firefox/Safari/jsdom) модуль тихо
 *     отключается: getLcpMs() → null, ошибок нет.
 *
 * Отчёт (DEV-консоль) привязан к завершению загрузки: сравнивает LCP с
 * меткой first-scene-playable — если LCP сильно позже, стартовый экран
 * «красился» дольше, чем грузилась игра, и стоит смотреть в сторону
 * шрифтов/постера меню, а не бандла.
 */

type LcpEntry = {
  startTime: number;
  element?: { tagName?: string };
};

let lastLcpMs: number | null = null;
let lastLcpTag: string | null = null;
let observerStarted = false;

function startLcpObserver(): void {
  if (observerStarted) return;
  if (typeof window === 'undefined' || typeof PerformanceObserver === 'undefined') return;

  observerStarted = true;
  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries() as unknown as LcpEntry[];
      const latest = entries[entries.length - 1];
      if (!latest) return;
      lastLcpMs = latest.startTime;
      lastLcpTag = latest.element?.tagName ?? null;
    });
    // buffered: true — получить отрисовки, случившиеся до подписки.
    observer.observe({ type: 'largest-contentful-paint', buffered: true } as PerformanceObserverInit);
  } catch {
    // Firefox/Safari и тестовые среды не поддерживают тип — модуль отключён.
    observerStarted = false;
  }
}

/** Вызывается один раз при инициализации приложения (main.tsx). */
export function initLcpProfiler(): void {
  startLcpObserver();
}

/** Последний зафиксированный LCP (мс от navigationStart) или null. */
export function getLcpMs(): number | null {
  return lastLcpMs;
}

/** Имя тега крупнейшего отрисованного элемента (диагностика) или null. */
export function getLcpElementTag(): string | null {
  return lastLcpTag;
}

/** Тестовая точка — сброс модульного состояния. */
export function resetLcpProfilerForTests(): void {
  lastLcpMs = null;
  lastLcpTag = null;
  observerStarted = false;
}
