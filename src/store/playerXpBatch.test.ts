import { describe, it, expect, vi, beforeEach } from 'vitest';
import { queuePlayerXp, resetPlayerXpBatch } from './playerXpBatch';

describe('playerXpBatch', () => {
  beforeEach(() => {
    resetPlayerXpBatch();
  });

  it('resetPlayerXpBatch prevents a queued flush from applying XP', async () => {
    const set = vi.fn();
    queuePlayerXp(50, set);
    resetPlayerXpBatch();
    await Promise.resolve();
    expect(set).not.toHaveBeenCalled();
  });

  it('coalesces XP into one set call after microtask', async () => {
    const set = vi.fn();
    queuePlayerXp(10, set);
    queuePlayerXp(20, set);
    await Promise.resolve();
    expect(set).toHaveBeenCalledTimes(1);
  });
});
