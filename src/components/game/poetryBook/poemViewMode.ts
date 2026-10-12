/* ─── Volodka RPG – вид чтения стиха в «Собрании стихов» (v4.48.9) ───
 * 'spread' — разворот «Ночной тетради» (две страницы, поля с янтарной
 * разметкой), 'scroll' — прежний одноколоночный свиток.
 *
 * Политика выбора: явный выбор игрока липкий (localStorage); без выбора —
 * авто по ширине экрана (lg+ → разворот). Все обращения к window —
 * в try/catch: утилита может вызываться вне браузера (SSR/тесты).
 */

export type PoemViewMode = 'spread' | 'scroll';

const STORAGE_KEY = 'volodka:poetry-view-mode';
const DESKTOP_SPREAD_QUERY = '(min-width: 1024px)';

function isPoemViewMode(value: unknown): value is PoemViewMode {
  return value === 'spread' || value === 'scroll';
}

export function readStoredPoemViewMode(): PoemViewMode | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return isPoemViewMode(raw) ? raw : null;
  } catch {
    return null;
  }
}

export function writeStoredPoemViewMode(mode: PoemViewMode): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* приватный режим / недоступный storage — выбор живёт до перезагрузки */
  }
}

/** Автовыбор: липкое предпочтение игрока, иначе разворот на lg+. */
export function resolveDefaultPoemViewMode(): PoemViewMode {
  const stored = readStoredPoemViewMode();
  if (stored) return stored;
  try {
    return window.matchMedia(DESKTOP_SPREAD_QUERY).matches ? 'spread' : 'scroll';
  } catch {
    return 'scroll';
  }
}
