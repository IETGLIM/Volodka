import { describe, expect, it } from 'vitest';
import {
  buildActFooterLabel,
  buildChapterSubtitle,
  buildQuoteAriaLabel,
  getActThemeColor,
  getMatrixColumnCount,
} from '@/engine/matrixQuote/matrixQuotePresentation';

describe('matrixQuotePresentation', () => {
  it('returns act theme colors', () => {
    expect(getActThemeColor(1)).toBe('#00ffee');
    expect(getActThemeColor(3)).toBe('#ff6644');
    expect(getActThemeColor(99)).toBe('#00ffee');
  });

  it('limits matrix columns by device tier', () => {
    expect(getMatrixColumnCount(1920, 'high')).toBe(80);
    expect(getMatrixColumnCount(1920, 'medium')).toBe(56);
    expect(getMatrixColumnCount(1920, 'low')).toBe(32);
    expect(getMatrixColumnCount(320, 'high')).toBe(18);
  });

  it('builds chapter subtitle and footer labels', () => {
    expect(buildChapterSubtitle(2, 'Пробуждение')).toBe('Акт 2 — Пробуждение');
    expect(buildActFooterLabel(1, 'intro')).toBe('АКТ 1 · INTRO');
    expect(buildActFooterLabel(5)).toBe('АКТ 5');
  });

  it('builds aria label for screen readers', () => {
    expect(buildQuoteAriaLabel(4, 'Тень')).toBe('Акт 4: Тень');
    expect(buildQuoteAriaLabel(6)).toBe('Акт 6');
  });
});
