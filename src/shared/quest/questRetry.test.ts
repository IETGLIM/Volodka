import { describe, expect, it } from 'vitest';
import { questCanRetry } from './questRetry';

describe('questCanRetry', () => {
  it('defaults to true when canRetry is omitted', () => {
    expect(questCanRetry({})).toBe(true);
    expect(questCanRetry(undefined)).toBe(true);
  });

  it('returns false only when canRetry is explicitly false', () => {
    expect(questCanRetry({ canRetry: false })).toBe(false);
    expect(questCanRetry({ canRetry: true })).toBe(true);
  });
});
