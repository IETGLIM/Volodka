import { describe, expect, it } from 'vitest';
import { resolveNearest } from './InteractionResolver';

describe('resolveNearest', () => {
  it('returns null for empty list', () => {
    expect(resolveNearest([])).toBeNull();
  });

  it('picks smallest distance without mutating input order', () => {
    const a = [
      { id: 'far', distance: 5 },
      { id: 'near', distance: 1.2 },
      { id: 'mid', distance: 3 },
    ];
    expect(resolveNearest(a)?.id).toBe('near');
    expect(a[0].id).toBe('far');
  });
});
