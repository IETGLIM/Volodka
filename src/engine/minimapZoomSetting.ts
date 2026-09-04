/* ─── Volodka RPG – настройка «Масштаб миникарты» (v4.8.5) ───
 *
 * Три фиксированных уровня обзора миникарты. Хранится в localStorage
 * (паттерн arrivalCinematicsSetting — чистый модуль без React-зависимостей).
 *
 * Потребитель — MinimapComponent: множитель умножается на вычисленный
 * радиус обзора сцены (viewRadius). Меньший радиус = «крупнее» мир
 * (приближение), больший = «обзорнее» (дальновидение).
 *
 * UI — кнопки +/- на рамке миникарты; отдельная вкладка настроек не нужна:
 * настройка контекстная и меняется на месте.
 */

const LS_KEY = 'volodka_minimap_zoom_index';

export interface MinimapZoomLevel {
  /** Стабильный id (для тестов и отладки). */
  readonly id: 'far' | 'normal' | 'close';
  /** Русская подпись уровня (aria-label / подсказка). */
  readonly labelRu: string;
  /** Множитель радиуса обзора: <1 — приближение, >1 — обзор. */
  readonly radiusMultiplier: number;
}

/** От дальнего обзора к крупному плану. */
export const MINIMAP_ZOOM_LEVELS: readonly MinimapZoomLevel[] = [
  { id: 'far', labelRu: 'Обзор', radiusMultiplier: 1.35 },
  { id: 'normal', labelRu: 'Обычный', radiusMultiplier: 1 },
  { id: 'close', labelRu: 'Крупный', radiusMultiplier: 0.7 },
];

export const MINIMAP_ZOOM_DEFAULT_INDEX = 1;

/** Жёсткий нижний порог радиуса обзора в мировых единицах —
 *  чтобы «крупный» план не превратил миникарту в «нос игрока». */
export const MINIMAP_VIEW_RADIUS_MIN = 4;

export function clampMinimapZoomIndex(raw: number): number {
  if (!Number.isFinite(raw)) return MINIMAP_ZOOM_DEFAULT_INDEX;
  return Math.max(0, Math.min(MINIMAP_ZOOM_LEVELS.length - 1, Math.round(raw)));
}

/** Прочитать сохранённый индекс уровня (safe при приватном режиме/SSR). */
export function readMinimapZoomIndex(): number {
  if (typeof window === 'undefined') return MINIMAP_ZOOM_DEFAULT_INDEX;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw === null) return MINIMAP_ZOOM_DEFAULT_INDEX;
    return clampMinimapZoomIndex(Number(raw));
  } catch {
    return MINIMAP_ZOOM_DEFAULT_INDEX;
  }
}

/** Сохранить индекс уровня (клэмп 0..2, тихая деградация без storage). */
export function writeMinimapZoomIndex(index: number): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LS_KEY, String(clampMinimapZoomIndex(index)));
  } catch {
    /* private mode — настройка просто не переживёт перезагрузку */
  }
}

/** Множитель радиуса для индекса (клэмпится внутрь диапазона уровней). */
export function getMinimapZoomRadiusMultiplier(index: number): number {
  const level = MINIMAP_ZOOM_LEVELS[clampMinimapZoomIndex(index)];
  return level ? level.radiusMultiplier : 1;
}
