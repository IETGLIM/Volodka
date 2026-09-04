/* ─── Volodka RPG – panel shortcut dispatcher (mobile HUD / gamepad → orchestrator) ───
 *
 * Мост между HUD-виджетами и панельным свитчбордом оркестратора.
 *
 * ПРОБЛЕМА (до v4.8.5): MobileActionButtons открывал инвентарь/журнал
 * синтетическим KeyboardEvent('KeyI'/'KeyJ'). Это работало, но:
 *   • событие проходит по ВСЕМ подписчикам window (мини-игры, photo mode),
 *     каждый обязан сам догадываться, что это «не настоящая» клавиша;
 *   • поведение зависит от порядка подписчиков;
 *   • нельзя вызвать панель напрямую из не-клавиатурных источников.
 *
 * РЕШЕНИЕ: оркестратор регистрирует обработчик панели через
 * registerPanelShortcutHandler(); виджеты вызывают firePanelShortcut('KeyI').
 * Коды остались KeyboardEvent.code — та же семантика, что и у клавиатуры.
 * Если оркестратор ещё не смонтирован (меню/интро) — деградация к прежнему
 * синтетическому событию для обратной совместимости.
 */

/** KeyboardEvent.code, который понимает панельный свитчборд (KeyI, KeyJ, …). */
export type PanelShortcutCode = string;

export type PanelShortcutHandler = (code: PanelShortcutCode) => boolean;

let activeHandler: PanelShortcutHandler | null = null;

/**
 * Зарегистрировать обработчик панельных шорткатов (вызывает оркестратор).
 * @returns функция отрегистрации — идемпотентна, безопасна при HMR/размонтировании.
 */
export function registerPanelShortcutHandler(handler: PanelShortcutHandler): () => void {
  activeHandler = handler;
  return () => {
    if (activeHandler === handler) {
      activeHandler = null;
    }
  };
}

/** Обработчик зарегистрирован оркестратором? (для тестов и диагностики). */
export function hasPanelShortcutHandler(): boolean {
  return activeHandler !== null;
}

/**
 * Открыть/переключить панель напрямую, минуя синтетическую клавиатуру.
 * Возвращает true, если код обработан (зарегистрированным свитчбордом).
 * Фолбэк — прежнее поведение: синтетический keydown на window.
 */
export function firePanelShortcut(code: PanelShortcutCode): boolean {
  if (activeHandler) {
    return activeHandler(code);
  }

  /* Фолбэк: оркестратор не смонтирован (меню, интро, тесты) —
   * ведём себя ровно как до введения диспетчера. */
  try {
    window.dispatchEvent(
      new KeyboardEvent('keydown', { code, bubbles: true, cancelable: true }),
    );
    return true;
  } catch {
    /* SSR / тестовый окружение без window */
    return false;
  }
}
