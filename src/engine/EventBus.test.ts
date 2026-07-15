import { describe, expect, it, vi } from 'vitest';
import { createEventBus, EventBusPriority } from './EventBus';

describe('EventBusClass lifecycle', () => {
  it('aborts onAny when dispose runs inside typed handler', () => {
    const bus = createEventBus();
    const anyHandler = vi.fn();

    bus.onAny(anyHandler, EventBusPriority.Debug);
    bus.on('sound:play', () => {
      bus.dispose();
    });

    bus.emit('sound:play', { type: 'item_use' });

    expect(anyHandler).not.toHaveBeenCalled();
  });

  it('allows emit after dispose once bus is revived and handlers are re-subscribed', () => {
    const bus = createEventBus();
    const handler = vi.fn();

    bus.on('sound:play', handler);
    bus.emit('sound:play', { type: 'item_use' });
    expect(handler).toHaveBeenCalledTimes(1);

    bus.dispose();
    bus.revive();

    bus.on('sound:play', handler);
    bus.emit('sound:play', { type: 'item_use' });
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it('auto-revives when subscribing on a disposed bus', () => {
    const bus = createEventBus();
    bus.dispose();

    // Auto-revive: subscribing on a disposed bus clears the disposed flag
    // instead of throwing, so React StrictMode remount races are safe.
    const handler = vi.fn();
    const anyHandler = vi.fn();
    expect(() => bus.on('sound:play', handler)).not.toThrow();
    expect(() => bus.onAny(anyHandler)).not.toThrow();

    // Bus should be functional again after auto-revive
    bus.emit('sound:play', { type: 'item_use' });
    expect(handler).toHaveBeenCalledTimes(1);
    expect(anyHandler).toHaveBeenCalledTimes(1);
    expect(bus.isDisposed()).toBe(false);
  });

  it('revive is idempotent', () => {
    const bus = createEventBus();
    bus.dispose();
    bus.revive();
    expect(() => bus.on('sound:play', vi.fn())).not.toThrow();
    bus.revive();
    expect(() => bus.on('sound:play', vi.fn())).not.toThrow();
  });

  it('snapshots onAny handlers registered during typed dispatch', () => {
    const bus = createEventBus();
    const order: string[] = [];

    bus.on('sound:play', () => {
      order.push('typed');
      bus.onAny(() => {
        order.push('late-any');
      }, EventBusPriority.Debug);
    });
    bus.onAny(() => {
      order.push('any');
    }, EventBusPriority.Debug);

    bus.emit('sound:play', { type: 'item_use' });

    expect(order).toEqual(['typed', 'any']);
  });

  it('aborts remaining typed handlers when dispose runs mid-dispatch', () => {
    const bus = createEventBus();
    const second = vi.fn();

    bus.on('sound:play', () => {
      bus.dispose();
    });
    bus.on('sound:play', second);

    bus.emit('sound:play', { type: 'item_use' });

    expect(second).not.toHaveBeenCalled();
  });
});

describe('EventBusClass dedup', () => {
  it('fires quest:completed twice within the dedup window', () => {
    const bus = createEventBus();
    const handler = vi.fn();

    bus.on('quest:completed', handler);
    bus.emit('quest:completed', { questId: 'q1' });
    bus.emit('quest:completed', { questId: 'q1' });

    expect(handler).toHaveBeenCalledTimes(2);
  });

  it('suppresses duplicate fx:glitch within the dedup window', () => {
    const bus = createEventBus();
    const handler = vi.fn();
    const payload = { intensity: 0.5, duration: 300 };

    bus.on('fx:glitch', handler);
    bus.emit('fx:glitch', payload);
    bus.emit('fx:glitch', payload);

    expect(handler).toHaveBeenCalledTimes(1);
  });
});

describe('EventBusClass priority dispatch', () => {
  it('runs lower priority numbers before higher tiers', () => {
    const bus = createEventBus();
    const order: string[] = [];

    bus.on('combat:turn', () => order.push('fx'), EventBusPriority.FX);
    bus.on('combat:turn', () => order.push('engine'), EventBusPriority.Engine);
    bus.on('combat:turn', () => order.push('ui'), EventBusPriority.UI);
    bus.on('combat:turn', () => order.push('orchestrator'), EventBusPriority.Orchestrator);

    bus.emit('combat:turn', { turn: 1, isPlayerTurn: true });

    expect(order).toEqual(['engine', 'orchestrator', 'ui', 'fx']);
  });

  it('preserves registration order within the same priority tier', () => {
    const bus = createEventBus();
    const order: number[] = [];

    bus.on('combat:turn', () => order.push(1), EventBusPriority.UI);
    bus.on('combat:turn', () => order.push(2), EventBusPriority.UI);
    bus.on('combat:turn', () => order.push(3), EventBusPriority.UI);

    bus.emit('combat:turn', { turn: 2, isPlayerTurn: false });

    expect(order).toEqual([1, 2, 3]);
  });

  it('runs onAny handlers after typed handlers, sorted by priority', () => {
    const bus = createEventBus();
    const order: string[] = [];

    bus.on('combat:turn', () => order.push('typed-ui'), EventBusPriority.UI);
    bus.onAny(() => order.push('any-debug'), EventBusPriority.Debug);
    bus.onAny(() => order.push('any-engine'), EventBusPriority.Engine);

    bus.emit('combat:turn', { turn: 1, isPlayerTurn: true });

    expect(order).toEqual(['typed-ui', 'any-engine', 'any-debug']);
  });
});

describe('EventBusClass handler limits', () => {
  it('throws when typed handler limit is reached', () => {
    const bus = createEventBus({ maxHandlersPerEvent: 2 });
    bus.on('sound:play', vi.fn());
    bus.on('sound:play', vi.fn());

    expect(() => bus.on('sound:play', vi.fn())).toThrow(/limit: 2/i);
  });

  it('allows subscribe again after unsubscribe frees a slot', () => {
    const bus = createEventBus({ maxHandlersPerEvent: 1 });
    const unsub = bus.on('sound:play', vi.fn());

    expect(() => bus.on('sound:play', vi.fn())).toThrow(/limit: 1/i);

    unsub();
    expect(() => bus.on('sound:play', vi.fn())).not.toThrow();
  });

  it('throws when onAny handler limit is reached', () => {
    const bus = createEventBus({ maxAnyHandlers: 1 });
    bus.onAny(vi.fn());

    expect(() => bus.onAny(vi.fn())).toThrow(/onAny.*limit: 1/i);
  });
});
