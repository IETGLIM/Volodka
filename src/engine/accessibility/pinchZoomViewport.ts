/**
 * Управление viewport-метой для жеста масштабирования (аудит этап 121).
 *
 * Проблема: index.html фиксирует viewport как
 * `maximum-scale=1.0, user-scalable=no` — обязательная мера для 3D-игры
 * (случайный пинч во время геймплея ломает HUD и touch-координаты),
 * но это a11i-минус (WCAG 1.4.4 / 1.4.10): слабовидящий игрок не может
 * приблизить интерфейс браузерным зумом.
 *
 * Решение: настройка «Масштабирование жестом (пинч)» в разделе
 * «Доступность». По умолчанию выключена — игровая фиксация. При
 * включении мета переписывается на зумируемую (uiTextScale при этом
 * продолжает работать — это независимые механизмы масштабирования).
 */

/** Игровая фиксация viewport (как в index.html по умолчанию). */
export const VIEWPORT_META_CONTENT_GAME =
  'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';

/** Зумируемый viewport — блокировки жеста масштабирования сняты. */
export const VIEWPORT_META_CONTENT_ZOOMABLE =
  'width=device-width, initial-scale=1.0, viewport-fit=cover';

/** Найти текущую viewport-мету документа (или null — SSR/нет документа). */
export function findViewportMeta(): HTMLMetaElement | null {
  if (typeof document === 'undefined' || typeof document.querySelector !== 'function') {
    return null;
  }
  return document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
}

/** Переписать viewport-мету под выбранную политику зума. Идемпотентно. */
export function applyPinchZoomViewport(enabled: boolean): void {
  const meta = findViewportMeta();
  if (!meta) return;
  const next = enabled ? VIEWPORT_META_CONTENT_ZOOMABLE : VIEWPORT_META_CONTENT_GAME;
  if (meta.content !== next) meta.content = next;
}
