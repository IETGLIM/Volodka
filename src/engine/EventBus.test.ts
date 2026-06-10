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

  it('allows emit after dispose once handlers are re-subscribed', () => {
    const bus = createEventBus();
    const handler = vi.fn();

    bus.on('sound:play', handler);
    bus.emit('sound:play', { type: 'item_use' });
    expect(handler).toHaveBeenCalledTimes(1);

    bus.dispose();

    bus.on('sound:play', handler);
    bus.emit('sound:play', { type: 'item_use' });
    expect(handler).toHaveBeenCalledTimes(2);
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
