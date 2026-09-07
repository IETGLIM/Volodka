/**
 * PostCSS-плагин «volodka-ui-text-scale» — системное лечение микротекста
 * (аудит этап 79: «Микротекст 7–10px в 194 файлах, частично гейтируется»).
 *
 * Проблема: ~1200 Tailwind arbitrary-классов (text-[7px]…text-[11px]) и ~190
 * ручных CSS-деклараций задают font-size px-литералами. Корневое правило
 * html{font-size:calc(16px*var(--volodka-ui-text-scale))} из globals.css
 * масштабирует ТОЛЬКО rem-текст (меньшинство интерфейса) — слайдер
 * «Масштаб интерфейса» в настройках почти не влиял на HUD и панели.
 *
 * Лечение: на этапе CSS-пайплайна каждая декларация font-size с ЧИСТЫМ
 * px-литералом переписывается в calc(Npx * var(--volodka-ui-text-scale, 1)).
 *
 * Почему PostCSS, а не правка 194 файлов:
 *  - @tailwindcss/vite работает с enforce:'pre' — его transform разворачивает
 *    утилиты (в т.ч. text-[9px]) ДО внутреннего vite:css, который применяет
 *    этот postcss.config; плагин видит финальный CSS в dev и build одинаково;
 *  - ноль изменений в исходниках компонентов — правило одно для всех;
 *  - будущие text-[Npx] автоматически подчиняются масштабу.
 *
 * Границы (сознательные):
 *  - НЕ трогает rem/em/%/unitless и значения с calc()/var() — нет двойного
 *    масштабирования rem-цепочки и уже-обработанных правил;
 *  - НЕ трогает line-height и прочие свойства (px-leading используется как
 *    раскладочный приём; глифы растут, сетки не ломаются);
 *  - PostCSS парсит important отдельно (decl.important), значение остаётся
 *    чистым 'Npx' — суффикс !important сохраняется автоматически.
 */

const FONT_SIZE_PX = /^(\d*\.?\d+)px$/;

const UI_TEXT_SCALE_VAR = '--volodka-ui-text-scale';

/** Имя плагина — для диагностики и тестов. */
export const UI_TEXT_SCALE_POSTCSS_PLUGIN_NAME = 'volodka-ui-text-scale';

/**
 * Создать плагин. Возвращает postcss-8 объект с Declaration-визитором —
 * синхронный, без AST-аллокаций сверх мутации decl.value.
 */
export function volodkaUiTextScale() {
  return {
    postcssPlugin: UI_TEXT_SCALE_POSTCSS_PLUGIN_NAME,
    Declaration(decl) {
      if (decl.prop !== 'font-size') return;
      const value = decl.value.trim();
      const match = FONT_SIZE_PX.exec(value);
      if (!match) return;
      decl.value = `calc(${match[1]}px * var(${UI_TEXT_SCALE_VAR}, 1))`;
    },
  };
}

export default volodkaUiTextScale;
