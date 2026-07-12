import { describe, expect, it, vi } from 'vitest';
import { createEventBus } from './EventBus';
import { bindEventBusScope, EventBusScope } from './eventBusScope';

describe('EventBusScope', () => {
  it('disposes all registered listeners without handler references', () => {
    const bus = createEventBus();
    const scope = bus.createScope();
    const handler = vi.fn();

    scope.on('sound:play', handler);
    bus.emit('sound:play', { type: 'item_use' });
    expect(handler).toHaveBeenCalledTimes(1);

    scope.dispose();
    bus.emit('sound:play', { type: 'item_use' });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('runs custom cleanups in LIFO order on dispose', () => {
    const bus = createEventBus();
    const scope = bus.createScope();
    const order: string[] = [];

    scope.add(() => order.push('first'));
    scope.add(() => order.push('second'));

    scope.dispose();
    expect(order).toEqual(['second', 'first']);
  });

  it('is idempotent — double dispose is safe', () => {
    const bus = createEventBus();
    const scope = bus.createScope();
    const cleanup = vi.fn();

    scope.add(cleanup);
    scope.dispose();
    scope.dispose();

    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(scope.isDisposed).toBe(true);
  });

  it('throws when subscribing after dispose', () => {
    const bus = createEventBus();
    const scope = bus.createScope();
    scope.dispose();

    expect(() => scope.on('sound:play', vi.fn())).toThrow(
      '[EventBusScope] Cannot subscribe on a disposed scope',
    );
  });

  it('bindEventBusScope tears down partial registrations on throw', () => {
    const bus = createEventBus();
    const handler = vi.fn();

    expect(() =>
      bindEventBusScope(bus, (scope) => {
        scope.on('sound:play', handler);
        throw new Error('register failed');
      }),
    ).toThrow('register failed');

    bus.emit('sound:play', { type: 'item_use' });
    expect(handler).not.toHaveBeenCalled();
  });

  it('bindEventBusScope returns dispose that removes all listeners', () => {
    const bus = createEventBus();
    const handler = vi.fn();
    const customCleanup = vi.fn();

    const dispose = bindEventBusScope(bus, (scope) => {
      scope.on('sound:play', handler);
      scope.add(customCleanup);
    });

    bus.emit('sound:play', { type: 'item_use' });
    expect(handler).toHaveBeenCalledTimes(1);

    dispose();
    expect(customCleanup).toHaveBeenCalledTimes(1);

    bus.emit('sound:play', { type: 'item_use' });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('tracks onAny subscriptions', () => {
    const bus = createEventBus();
    const scope = new EventBusScope(bus);
    const anyHandler = vi.fn();

    scope.onAny(anyHandler);
    bus.emit('sound:play', { type: 'item_use' });
    expect(anyHandler).toHaveBeenCalledTimes(1);

    scope.dispose();
    bus.emit('sound:play', { type: 'item_use' });
    expect(anyHandler).toHaveBeenCalledTimes(1);
  });
});
