import { describe, it, expect, vi } from 'vitest';
import { createSourceRefCache, memoizeBySourceRef } from './memo';

describe('memoizeBySourceRef', () => {
  it('caches null results for the same source reference', () => {
    const cache = createSourceRefCache<object, string | null>();
    const source = {};
    const compute = vi.fn(() => null as string | null);

    expect(memoizeBySourceRef(source, cache, compute)).toBeNull();
    expect(memoizeBySourceRef(source, cache, compute)).toBeNull();
    expect(compute).toHaveBeenCalledTimes(1);
  });

  it('recomputes when the source reference changes', () => {
    const cache = createSourceRefCache<object, number>();
    const compute = vi.fn((source: object) => (source as { id: number }).id);

    expect(memoizeBySourceRef({ id: 1 }, cache, compute)).toBe(1);
    expect(memoizeBySourceRef({ id: 2 }, cache, compute)).toBe(2);
    expect(compute).toHaveBeenCalledTimes(2);
  });

  it('returns cached value without recomputing for the same source reference', () => {
    const cache = createSourceRefCache<number[], number>();
    const source = [1, 2, 3];
    const compute = vi.fn((values: number[]) => values.reduce((sum, n) => sum + n, 0));

    expect(memoizeBySourceRef(source, cache, compute)).toBe(6);
    expect(memoizeBySourceRef(source, cache, compute)).toBe(6);
    expect(compute).toHaveBeenCalledTimes(1);
  });
});
