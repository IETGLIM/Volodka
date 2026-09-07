/**
 * Тесты uiTextScaledPx (аудит этап 79 — микротекст): инлайн-стили и
 * DOM-слои движка подчиняются слайдеру «Масштаб интерфейса».
 */
import { describe, expect, it } from 'vitest';
import { UI_TEXT_SCALE_CSS_VAR, uiTextScaledPx } from './uiTextScaleCss';

describe('uiTextScaledPx', () => {
  it('возвращает calc-строку с var и fallback 1', () => {
    expect(uiTextScaledPx(10)).toBe(
      `calc(10px * var(${UI_TEXT_SCALE_CSS_VAR}, 1))`,
    );
  });

  it('поддерживает дробные размеры (канон HUD)', () => {
    expect(uiTextScaledPx(12.5)).toContain('12.5px');
  });

  it('имя переменной совпадает с пост-хуком AccessibilityManager', () => {
    // accessibilityDomPresentation применяет --volodka-ui-text-scale на <html>;
    // инлайн-calc обязан читать ту же переменную, иначе масштаб развалится.
    expect(UI_TEXT_SCALE_CSS_VAR).toBe('--volodka-ui-text-scale');
  });
});
