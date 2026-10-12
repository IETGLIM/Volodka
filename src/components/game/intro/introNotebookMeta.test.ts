import { describe, it, expect } from 'vitest';
import { toRoman } from './introNotebookMeta';
import { getPoemMargin } from '@/data/poemMargins';
import { INTRO_POEM_ID } from '@/engine/intro/introConfig';

/** Догеймплейный контекст интро — зеркалит INTRO_MARGIN_CONTEXT в IntroScreen. */
const introCtx = { karma: 0, flags: {}, currentAct: 1 } as const;

describe('introNotebookMeta.toRoman', () => {
  it('formats sheet numbers 1..21 used by the poem registry', () => {
    expect(toRoman(1)).toBe('I');
    expect(toRoman(2)).toBe('II');
    expect(toRoman(4)).toBe('IV');
    expect(toRoman(9)).toBe('IX');
    expect(toRoman(14)).toBe('XIV');
    expect(toRoman(21)).toBe('XXI');
  });

  it('clamps degenerate input to a valid sheet label', () => {
    expect(toRoman(0)).toBe('I');
    expect(toRoman(-5)).toBe('I');
    expect(toRoman(2.9)).toBe('II');
  });
});

describe('intro margin note (поля ночной тетради)', () => {
  it('intro poem is poem_2 and has an unconditional pencil note for the intro context', () => {
    expect(INTRO_POEM_ID).toBe('poem_2');
    const margin = getPoemMargin(INTRO_POEM_ID, introCtx);
    expect(margin).toBeDefined();
    expect(margin?.condition).toBeUndefined();
    expect(margin?.text.length).toBeGreaterThan(10);
  });

  it('intro context never selects conditional variants (no karma/flags before gameplay)', () => {
    const margin = getPoemMargin(INTRO_POEM_ID, introCtx);
    // base — безусловный вариант: «Писал в самую плохую ночь…»
    expect(margin?.id).toBe('margin_poem_2_base');
  });
});
