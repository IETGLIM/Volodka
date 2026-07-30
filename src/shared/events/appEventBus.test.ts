import { describe, it, expect, vi } from 'vitest';
import { bindAppEventBus, emitAppEvent, resetAppEventBusForTests } from './appEventBus';

describe('appEventBus', () => {
  it('forwards emit to bound bus', () => {
    resetAppEventBusForTests();
    const emit = vi.fn();
    bindAppEventBus({ emit, on: vi.fn(() => () => undefined) });

    emitAppEvent('game:loaded', {});
    expect(emit).toHaveBeenCalledWith('game:loaded', {});
  });

  it('drops emit before bind in dev without throwing', () => {
    resetAppEventBusForTests();
    expect(() => emitAppEvent('game:loaded', {})).not.toThrow();
  });

  it('queues pre-bind emits and flushes on bind', () => {
    resetAppEventBusForTests();
    emitAppEvent('game:loaded', {});
    emitAppEvent('game:loaded', {});

    const emit = vi.fn();
    bindAppEventBus({ emit, on: vi.fn(() => () => undefined) });

    expect(emit).toHaveBeenCalledTimes(2);
    expect(emit).toHaveBeenNthCalledWith(1, 'game:loaded', {});
    expect(emit).toHaveBeenNthCalledWith(2, 'game:loaded', {});
  });
});
