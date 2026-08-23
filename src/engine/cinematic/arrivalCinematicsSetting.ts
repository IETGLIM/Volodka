/* ─── Volodka RPG – настройка «Пропускать arrival-кат-сцены» (v4.7.7) ───
 *
 * Повторные игроки: вход в знакомую локацию с режиссурой (street_night,
 * city_square, park_day, …) каждый раз проигрывает 7–12-секундный
 * arrival-таймлайн. Опция отключает ВСЕ arrival-бит (сюжетные кат-сцены
 * актов и сплэши взаимодействий НЕ затрагиваются — только входы в сцены).
 *
 * Чистый модуль: чтение/запись localStorage + дефолт. UI-тумблер живёт в
 * SettingsPanel (вкладка «Управление»), потребитель — cameraStateMachine.
 */

const LS_KEY = 'volodka_skip_arrival_cinematics';

/** Дефолт: arrival-сцены ВКЛЮЧЕНЫ (первое впечатление — часть дизайна). */
export const SKIP_ARRIVAL_DEFAULT = false;

export function readSkipArrivalCinematics(): boolean {
  if (typeof window === 'undefined') return SKIP_ARRIVAL_DEFAULT;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw === null) return SKIP_ARRIVAL_DEFAULT;
    return raw === 'true';
  } catch {
    return SKIP_ARRIVAL_DEFAULT;
  }
}

export function writeSkipArrivalCinematics(value: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LS_KEY, String(value));
  } catch {
    // private mode — настройка просто не переживёт перезагрузку
  }
}
