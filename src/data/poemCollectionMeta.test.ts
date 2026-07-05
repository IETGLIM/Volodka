import { describe, expect, it } from 'vitest';
import {
  ALL_UNIFIED_POEM_IDS,
  HIDDEN_POEM_IDS,
  MAIN_POEM_IDS,
  POEMS_PER_ACT,
  TOTAL_HIDDEN_POEMS,
  TOTAL_MAIN_POEMS,
  TOTAL_UNIFIED_POEMS,
  countCollectedMainPoems,
  hasAllMainPoems,
  hasAllUnifiedPoems,
} from './poemCollectionMeta';

describe('poemCollectionMeta', () => {
  it('defines 21 main Vladimir poems and 46 unified total', () => {
    expect(TOTAL_MAIN_POEMS).toBe(21);
    expect(TOTAL_HIDDEN_POEMS).toBe(25);
    expect(TOTAL_UNIFIED_POEMS).toBe(46);
    expect(MAIN_POEM_IDS).toHaveLength(21);
    expect(HIDDEN_POEM_IDS).toHaveLength(25);
    expect(ALL_UNIFIED_POEM_IDS).toHaveLength(46);
  });

  it('sums per-act main poem counts to 21', () => {
    const sum = Object.values(POEMS_PER_ACT).reduce((acc, n) => acc + n, 0);
    expect(sum).toBe(TOTAL_MAIN_POEMS);
  });

  it('detects main vs unified completion separately', () => {
    const mainOnly = [...MAIN_POEM_IDS];
    expect(hasAllMainPoems(mainOnly)).toBe(true);
    expect(hasAllUnifiedPoems(mainOnly)).toBe(false);
    expect(countCollectedMainPoems(mainOnly)).toBe(21);
    expect(hasAllUnifiedPoems([...ALL_UNIFIED_POEM_IDS])).toBe(true);
  });
});
