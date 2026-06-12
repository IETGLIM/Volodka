import { describe, expect, it, vi, afterEach } from 'vitest';
import { RandomSoundLoopRegistry } from './randomSoundLoopRegistry';

describe('RandomSoundLoopRegistry', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('removes stale records when generation advances', () => {
    const registry = new RandomSoundLoopRegistry();
    const loop = registry.register();
    expect(registry.size).toBe(1);

    registry.clearAll();
    expect(registry.size).toBe(0);
    expect(registry.guard(loop)).toBe(false);
    expect(registry.size).toBe(0);
  });

  it('retires loop when guard sees disposed flag', () => {
    const registry = new RandomSoundLoopRegistry();
    const loop = registry.register();

    expect(registry.guard(loop, true)).toBe(false);
    expect(registry.size).toBe(0);
  });

  it('clears pending timers on retire', () => {
    vi.useFakeTimers();
    const registry = new RandomSoundLoopRegistry();
    const loop = registry.register();
    const callback = vi.fn();
    loop.timer = setTimeout(callback, 1000) as unknown as ReturnType<typeof setTimeout>;

    registry.retire(loop);
    vi.advanceTimersByTime(2000);

    expect(callback).not.toHaveBeenCalled();
    expect(registry.size).toBe(0);
  });
});
