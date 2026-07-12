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
});
