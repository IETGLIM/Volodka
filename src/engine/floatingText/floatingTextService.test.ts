import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FloatingTextService } from './floatingTextService';
import { MAX_POOL_SIZE, TEXT_LIFETIME_MS } from './floatingTextTypes';

describe('FloatingTextService', () => {
  let now = 0;
  let rng = 0.5;
  let frameCallbacks: Array<() => void> = [];
  let timeoutCallbacks: Array<{ run: () => void; at: number }> = [];
  let service: FloatingTextService;

  beforeEach(() => {
    now = 0;
    rng = 0.5;
    frameCallbacks = [];
    timeoutCallbacks = [];

    service = new FloatingTextService({
      rng: () => rng,
      now: () => now,
      scheduleFrame: (callback) => {
        frameCallbacks.push(callback);
        return frameCallbacks.length;
      },
      scheduleTimeout: (callback, delayMs) => {
        timeoutCallbacks.push({ run: callback, at: now + delayMs });
        return timeoutCallbacks.length as unknown as ReturnType<typeof setTimeout>;
      },
      clearScheduledTimeout: () => {},
    });
  });

  afterEach(() => {
    service.dispose();
  });

  function flushFrame(): void {
    const callbacks = frameCallbacks.splice(0);
    for (const callback of callbacks) {
      callback();
    }
  }

  it('batches multiple spawns into one snapshot update per frame', () => {
    const listener = vi.fn();
    service.subscribe(listener);

    service.spawn('one', 'xp');
    service.spawn('two', 'xp');
    expect(listener).not.toHaveBeenCalled();

    flushFrame();
    expect(listener).toHaveBeenCalledTimes(1);
    expect(service.getSnapshot()).toHaveLength(2);
  });

  it('trims the pool to MAX_POOL_SIZE evicting normal-priority entries first', () => {
    for (let i = 0; i < MAX_POOL_SIZE + 3; i += 1) {
      service.spawn(`text-${i}`, 'custom');
    }
    flushFrame();

    expect(service.getSnapshot()).toHaveLength(MAX_POOL_SIZE);
    expect(service.getSnapshot()[0]?.text).toBe('text-3');
  });

  it('keeps high-priority entries when trimming', () => {
    service.spawn('level-up', 'levelup');
    for (let i = 0; i < MAX_POOL_SIZE; i += 1) {
      service.spawn(`filler-${i}`, 'custom');
    }
    flushFrame();

    expect(service.getSnapshot().some((entry) => entry.text === 'level-up')).toBe(true);
  });

  it('prunes expired entries on the next scheduled expiry', () => {
    const listener = vi.fn();
    service.subscribe(listener);

    service.spawn('old', 'xp');
    flushFrame();
    listener.mockClear();

    now = TEXT_LIFETIME_MS + 1;
    const expiry = timeoutCallbacks.shift();
    expiry?.run();

    expect(service.getSnapshot()).toHaveLength(0);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('reset clears pool and notifies subscribers', () => {
    const listener = vi.fn();
    service.subscribe(listener);

    service.spawn('text', 'xp');
    flushFrame();
    listener.mockClear();

    service.reset();
    expect(service.getSnapshot()).toEqual([]);
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
