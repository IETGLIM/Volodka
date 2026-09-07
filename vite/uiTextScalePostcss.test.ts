/**
 * Тесты PostCSS-плагина volodka-ui-text-scale (аудит этап 79 — микротекст).
 *
 * Плагин переписывает ЧИСТЫЕ px-литералы font-size в
 * calc(Npx * var(--volodka-ui-text-scale, 1)), оставляя нетронутыми
 * rem/em/%/calc()/var() — чтобы не было двойного масштабирования
 * rem-цепочки и уже-обработанных правил.
 */
import { describe, expect, it } from 'vitest';
import postcss from 'postcss';
import {
  UI_TEXT_SCALE_POSTCSS_PLUGIN_NAME,
  volodkaUiTextScale,
} from './uiTextScalePostcss.mjs';

const run = (css: string): string =>
  postcss([volodkaUiTextScale()]).process(css, { from: undefined }).css;

describe('volodka-ui-text-scale postcss plugin', () => {
  it('переписывает чистый px-литерал font-size в calc с var', () => {
    expect(run('.a { font-size: 10px; }')).toBe(
      '.a { font-size: calc(10px * var(--volodka-ui-text-scale, 1)); }',
    );
  });

  it('переписывает минифицированную декларацию (без пробелов) — build-путь Tailwind', () => {
    expect(run('.a{font-size:9px}')).toBe(
      '.a{font-size:calc(9px * var(--volodka-ui-text-scale, 1))}',
    );
  });

  it('поддерживает дробные значения и сохраняет !important', () => {
    expect(run('.a { font-size: 12.5px !important; }')).toBe(
      '.a { font-size: calc(12.5px * var(--volodka-ui-text-scale, 1)) !important; }',
    );
  });

  it('НЕ трогает rem / em / % / unitless — нет вторичного масштабирования', () => {
    const css = '.a { font-size: 0.75rem; } .b { font-size: 0.85em; } .c { font-size: 120%; }';
    expect(run(css)).toBe(css);
  });

  it('НЕ трогает calc()/var()-значения (корневое правило globals.css)', () => {
    const css =
      'html { font-size: calc(16px * var(--volodka-ui-text-scale, 1)); }';
    expect(run(css)).toBe(css);
  });

  it('НЕ трогает line-height и другие свойства', () => {
    const css = '.a { line-height: 14px; border-width: 10px; width: 100px; }';
    expect(run(css)).toBe(css);
  });

  it('обрабатывает несколько деклараций и селекторов за один проход', () => {
    const out = run(
      '.hud { font-size: 10px; line-height: 1.2; } .badge { font-size: 8px; }',
    );
    expect(out).toContain('calc(10px * var(--volodka-ui-text-scale, 1))');
    expect(out).toContain('calc(8px * var(--volodka-ui-text-scale, 1))');
    expect(out).toContain('line-height: 1.2');
  });

  it('не создаёт вложенный calc при повторном прогоне (идемпотентность)', () => {
    const once = run('.a { font-size: 10px; }');
    expect(run(once)).toBe(once);
  });

  it('имя плагина стабильно для диагностики', () => {
    expect(volodkaUiTextScale().postcssPlugin).toBe(
      UI_TEXT_SCALE_POSTCSS_PLUGIN_NAME,
    );
  });
});
