import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { consumeEKey, isEKeyConsumed, resetEKeyConsumption } from './eKeyConsumption';

describe('eKeyConsumption', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetEKeyConsumption();
  });

  afterEach(() => {
    vi.useRealTimers();
    resetEKeyConsumption();
  });

  it('starts unconsumed', () => {
    expect(isEKeyConsumed()).toBe(false);
  });

  it('consumes for the requested duration', () => {
    consumeEKey(300);
    expect(isEKeyConsumed()).toBe(true);
    vi.advanceTimersByTime(299);
    expect(isEKeyConsumed()).toBe(true);
    vi.advanceTimersByTime(1);
    expect(isEKeyConsumed()).toBe(false);
  });

  it('reset clears active debounce', () => {
    consumeEKey(500);
    resetEKeyConsumption();
    expect(isEKeyConsumed()).toBe(false);
  });
});
