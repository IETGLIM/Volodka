import { describe, expect, it } from 'vitest';
import {
  formatPoemExcerptText,
  formatTerminalPoemFrame,
  getPoemCombatExcerptLines,
  getPoemExcerpt,
  POEM_COMBAT_EXCERPT_LINE_COUNT,
  POEM_EXCERPT_LINE_COUNT,
} from './poemExcerpt';

describe('getPoemExcerpt', () => {
  it('takes the first four non-empty lines and marks longer poems as fragments', () => {
    const excerpt = getPoemExcerpt([
      'Смерть есть лишь начало.',
      'Верить бы в это хотелось.',
      '',
      'Как же меня всё достало.',
      'А ведь многое делалось.',
      'Ещё одна строка',
    ]);

    expect(excerpt.lines).toEqual([
      'Смерть есть лишь начало.',
      'Верить бы в это хотелось.',
      'Как же меня всё достало.',
      'А ведь многое делалось.',
    ]);
    expect(excerpt.isFragment).toBe(true);
    expect(excerpt.totalLineCount).toBe(5);
    expect(POEM_EXCERPT_LINE_COUNT).toBe(4);
  });

  it('accepts a poem-like object and marks short poems as complete', () => {
    const excerpt = getPoemExcerpt({
      lines: ['Одна', '', 'Две'],
    });

    expect(excerpt.lines).toEqual(['Одна', 'Две']);
    expect(excerpt.isFragment).toBe(false);
    expect(excerpt.totalLineCount).toBe(2);
  });

  it('formats excerpt text for single-stream typewriters', () => {
    expect(formatPoemExcerptText(['а', 'б'])).toBe('а\nб');
  });

  it('exposes a shorter combat excerpt from the same helper', () => {
    expect(POEM_COMBAT_EXCERPT_LINE_COUNT).toBe(2);
    expect(getPoemCombatExcerptLines(['a', '', 'b', 'c', 'd'])).toEqual(['a', 'b']);
  });

  it('formats a terminal ASCII frame from excerpt lines', () => {
    const frame = formatTerminalPoemFrame(
      ['Смерть есть лишь начало.', 'Верить бы в это хотелось.', 'x', 'y', 'z'],
      { innerWidth: 40 },
    );
    expect(frame).toContain('Смерть есть лишь начало.');
    expect(frame).toContain('┌');
    expect(frame).toContain('└');
    expect(frame.split('\n').length).toBe(8);
  });
});
