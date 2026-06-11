import { describe, it, expect } from 'vitest';
import { KARMA_HIGH_THRESHOLD, KARMA_LOW_THRESHOLD } from './constants';
import {
  POEM_MARGINS,
  getPoemMargin,
  selectPoemMargin,
  type PoemMargin,
  type PoemMarginContext,
} from './poemMargins';

const neutralCtx: PoemMarginContext = { karma: 50, flags: {}, currentAct: 1 };

describe('poemMargins data', () => {
  it('covers poem_1..poem_21 with at least 2 variants and an unconditional fallback each', () => {
    for (let i = 1; i <= 21; i++) {
      const poemId = `poem_${i}`;
      const variants = POEM_MARGINS.filter((m) => m.poemId === poemId);
      expect(variants.length, `${poemId} variants`).toBeGreaterThanOrEqual(2);
      expect(
        variants.some((m) => m.condition === undefined),
        `${poemId} unconditional fallback`,
      ).toBe(true);
    }
  });

  it('has unique margin ids', () => {
    const ids = POEM_MARGINS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('getPoemMargin', () => {
  it('falls back to the unconditional variant in a neutral context', () => {
    const margin = getPoemMargin('poem_1', neutralCtx);
    expect(margin?.id).toBe('margin_poem_1_base');
  });

  it('returns undefined for an unknown poem', () => {
    expect(getPoemMargin('poem_nope', neutralCtx)).toBeUndefined();
  });

  it('respects minKarma / maxKarma conditions', () => {
    const low = getPoemMargin('poem_1', { ...neutralCtx, karma: KARMA_LOW_THRESHOLD });
    expect(low?.id).toBe('margin_poem_1_low');

    const high = getPoemMargin('poem_1', { ...neutralCtx, karma: KARMA_HIGH_THRESHOLD });
    expect(high?.id).toBe('margin_poem_1_high');
  });

  it('respects requiredFlag conditions', () => {
    const withFlag = getPoemMargin('poem_2', { ...neutralCtx, flags: { zarema_arrested: true } });
    expect(withFlag?.id).toBe('margin_poem_2_zarema');

    const withoutFlag = getPoemMargin('poem_2', neutralCtx);
    expect(withoutFlag?.id).toBe('margin_poem_2_base');
  });

  it('respects minAct conditions', () => {
    const early = getPoemMargin('poem_3', neutralCtx);
    expect(early?.id).toBe('margin_poem_3_base');

    const late = getPoemMargin('poem_3', { ...neutralCtx, currentAct: 3 });
    expect(late?.id).toBe('margin_poem_3_act3');
  });
});

describe('selectPoemMargin priority', () => {
  const margins: PoemMargin[] = [
    { id: 'fallback', poemId: 'p', text: 'fallback' },
    { id: 'one_cond', poemId: 'p', text: 'one', condition: { minAct: 2 } },
    { id: 'two_cond', poemId: 'p', text: 'two', condition: { minAct: 2, requiredFlag: 'f' } },
    { id: 'one_cond_dup', poemId: 'p', text: 'dup', condition: { minAct: 2 } },
  ];

  it('prefers the variant with more matched conditions', () => {
    const ctx: PoemMarginContext = { karma: 50, flags: { f: true }, currentAct: 2 };
    expect(selectPoemMargin(margins, 'p', ctx)?.id).toBe('two_cond');
  });

  it('breaks specificity ties by array order', () => {
    const ctx: PoemMarginContext = { karma: 50, flags: {}, currentAct: 2 };
    expect(selectPoemMargin(margins, 'p', ctx)?.id).toBe('one_cond');
  });

  it('falls back when no conditional variant matches', () => {
    const ctx: PoemMarginContext = { karma: 50, flags: {}, currentAct: 1 };
    expect(selectPoemMargin(margins, 'p', ctx)?.id).toBe('fallback');
  });
});
