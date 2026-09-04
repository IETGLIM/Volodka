/* ─── Volodka RPG – настройка «Виброотклик» (v4.8.6) ───
 *
 * Мастер-выключатель тактильной отдачи (Vibration API) на мобильных:
 * касания кнопок HUD, получение урона, повышение уровня, завершение квеста.
 * Дефолт ВКЛ — вибрация уже использовалась джойстиком и кнопками до введения
 * настройки; переключатель даёт контроль без изменения привычного поведения.
 *
 * Чистый модуль: чтение/запись localStorage + дефолт (паттерн
 * voiceOverSettings / arrivalCinematicsSetting). UI-тумблер — SettingsPanel,
 * вкладка «Управление». Гейт применяется в hapticFeedback.ts на каждый вызов.
 */

const LS_KEY = 'volodka_haptics_enabled';

/** Дефолт: виброотклик ВКЛЮЧЁН (прежнее поведение игры). */
export const HAPTICS_DEFAULT = true;

/** Read persisted haptics preference (safe on SSR / private mode). */
export function readHapticsEnabled(): boolean {
  if (typeof window === 'undefined') return HAPTICS_DEFAULT;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw === null) return HAPTICS_DEFAULT;
    return raw === 'true';
  } catch {
    return HAPTICS_DEFAULT;
  }
}

/** Persist haptics preference (silent degradation without storage). */
export function writeHapticsEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LS_KEY, String(enabled));
  } catch {
    /* private mode — настройка просто не переживёт перезагрузку */
  }
}
