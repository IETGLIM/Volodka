/* ─── Volodka RPG – Hall of Fame / Зал славы (v4.55.0) ───
 * Локальная таблица рекордов (localStorage) — требование игрока:
 * «local high-score table». Живёт рядом с scoreEngine: движок счёта
 * периодически upsert'ит живую запись забега, а финализация происходит
 * при выходе в меню / начале нового забега / закрытии страницы.
 *
 * Формат: топ-10 по очкам, запись с тем же runId обновляется на месте,
 * поэтому долгий забег не плодит дубликаты.
 */

export interface HallOfFameEntry {
  /** Идентификатор забега — ключ дедупликации live-обновлений. */
  runId: string;
  score: number;
  kills: number;
  poemsCollected: number;
  questsCompleted: number;
  achievementsUnlocked: number;
  /** Лучшая серия побед подряд за забег. */
  maxStreak: number;
  /** Секунд от начала забега до записи. */
  playSeconds: number;
  /** ISO-дата записи (финализированная) или null для «сейчас играем». */
  dateISO: string | null;
}

const HALL_KEY = 'volodka:hall-of-fame:v1';
const MAX_ENTRIES = 10;
/** Порог значимости: забеги мельче этого счёта не засоряют таблицу. */
const MIN_ENTRY_SCORE = 25;

function safeParse(raw: string | null): HallOfFameEntry[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((e): e is HallOfFameEntry => (
      !!e && typeof e === 'object' && typeof (e as HallOfFameEntry).runId === 'string'
    ));
  } catch {
    return [];
  }
}

function sortAndTrim(entries: HallOfFameEntry[]): HallOfFameEntry[] {
  return entries
    .slice()
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_ENTRIES);
}

function readAll(): HallOfFameEntry[] {
  if (typeof window === 'undefined') return [];
  return sortAndTrim(safeParse(window.localStorage.getItem(HALL_KEY)));
}

function writeAll(entries: HallOfFameEntry[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(HALL_KEY, JSON.stringify(sortAndTrim(entries)));
  } catch {
    /* приватный режим / переполнение — тихо деградируем, это не игровой стейт */
  }
}

/** Текущая таблица (топ-10, отсортирована по убыванию очков). */
export function getHallOfFame(): HallOfFameEntry[] {
  return readAll();
}

/** Лучший счёт в таблице (0, если таблица пуста). */
export function getBestScore(): number {
  const all = readAll();
  return all.length > 0 ? all[0].score : 0;
}

/** Позиция записи в текущей таблице: 1-based, 0 — не в таблице. */
export function getEntryRank(runId: string): number {
  const idx = readAll().findIndex((e) => e.runId === runId);
  return idx >= 0 ? idx + 1 : 0;
}

/**
 * Upsert живой записи забега. Вызывается throttle'нуто из scoreEngine.
 * Незначимые забеги (score < MIN_ENTRY_SCORE) не сохраняются.
 */
export function upsertLiveEntry(entry: HallOfFameEntry): void {
  if (entry.score < MIN_ENTRY_SCORE) return;
  const all = readAll().filter((e) => e.runId !== entry.runId);
  all.push(entry);
  writeAll(all);
}

/**
 * Финализация: запись получает дату и живёт вечно. Забеги, которые так
 * и не набрали MIN_ENTRY_SCORE, просто исчезают (пыль ветра).
 */
export function finalizeEntry(runId: string): void {
  const all = readAll();
  const idx = all.findIndex((e) => e.runId === runId);
  if (idx < 0) return;
  if (!all[idx].dateISO) {
    all[idx] = { ...all[idx], dateISO: new Date().toISOString() };
  }
  writeAll(all);
}
