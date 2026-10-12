/* ─── Volodka RPG – прогресс чтения стихов (v4.48.11) ───
 * Отметки «прочитано» для «Собрания стихов» и журнала: множество id стихов,
 * текст которых игрок видел полностью (машинописец дописал / свиток открыт).
 *
 * Политика хранения — как в poemViewMode.ts: localStorage с ключом
 * 'volodka:'-префиксом, все обращения к window — в try/catch (утилита может
 * вызываться вне браузера: SSR/тесты/приватный режим). Стихи (id/тексты)
 * НЕ трогаются — хранится только список прочитанных id.
 */

export const POETRY_READ_STORAGE_KEY = 'volodka:poetry-read';

/** Синхронизация инстансов хука на одной странице (панель ↔ журнал). */
export const POETRY_READ_CHANGED_EVENT = 'volodka:poetry-read-changed';

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

/** Читает список прочитанных id; повреждённые/чужие данные → пустой список. */
export function readStoredPoemReadIds(): string[] {
  try {
    const raw = window.localStorage.getItem(POETRY_READ_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!isStringArray(parsed)) return [];
    // Дедупликация: один стих — одна отметка
    return [...new Set(parsed)];
  } catch {
    return [];
  }
}

/** Пишет список; в приватном режиме/недоступном storage отметка живёт до перезагрузки. */
export function writeStoredPoemReadIds(ids: readonly string[]): void {
  try {
    window.localStorage.setItem(POETRY_READ_STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    /* приватный режим — прогресс чтения не сохраняется */
  }
}

/** Идемпотентно добавляет стих к прочитанным (новый массив или тот же список). */
export function withPoemMarkedRead(ids: readonly string[], poemId: string): string[] {
  if (ids.includes(poemId)) return [...ids];
  return [...ids, poemId];
}

/** Уведомляет другие хуки на странице, что список прочитанных изменился. */
export function notifyPoemReadChanged(): void {
  try {
    window.dispatchEvent(new CustomEvent(POETRY_READ_CHANGED_EVENT));
  } catch {
    /* без событий — остаётся локальное состояние инстанса */
  }
}
