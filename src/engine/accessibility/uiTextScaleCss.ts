/**
 * uiTextScale для инлайн-стилей и DOM-слоёв движка (аудит этап 79 — микротекст).
 *
 * Проблема: настройки доступности уже имеют uiTextScale (слайдер «Масштаб
 * интерфейса», 0.85–1.3) и применяют CSS-переменную --volodka-ui-text-scale
 * на <html>, НО корневой html{font-size:…} масштабирует только rem-текст.
 * Инлайн-стили вида style={{ fontSize: '10px' }} и DOM-узлы, создаваемые
 * движком (числа урона, лейблы), задают px-литералы и игнорировали слайдер.
 *
 * Решение (единое с PostCSS-плагином vite/uiTextScalePostcss.mjs):
 * uiTextScaledPx(N) → 'calc(Npx * var(--volodka-ui-text-scale, 1))'.
 *
 * Свойства решения:
 *  - var() наследуется от <html> во всём документе (shadow DOM в проекте нет);
 *  - fallback 1 — текст не ломается, если AccessibilityManager ещё не применил
 *    переменную (первый кадр до init);
 *  - двойного масштабирования нет: корневой html{font-size:calc(16px*var(…))}
 *    в globals.css задаёт rem-цепочку, а инлайн calc() — px-цепочку; каждая
 *    умножается на переменную ровно один раз.
 */

/** Имя CSS-переменной (единый источник истины для TS-потребителей). */
export const UI_TEXT_SCALE_CSS_VAR = '--volodka-ui-text-scale' as const;

/** Инлайн-значение font-size, подчиняющееся uiTextScale. */
export function uiTextScaledPx(px: number): string {
  return `calc(${px}px * var(${UI_TEXT_SCALE_CSS_VAR}, 1))`;
}
