import { describe, expectTypeOf, it } from 'vitest';
import type { EventMap, EventName } from '@/engine/events';
import { createEventBus, type EventBusClass } from '@/engine/EventBus';

describe('EventMap compile-time contracts', () => {
  it('createEventBus defaults to EventMap', () => {
    const bus = createEventBus();
    expectTypeOf(bus).toEqualTypeOf<EventBusClass<EventMap>>();
  });

  it('emit/on keys are EventName', () => {
    const bus = createEventBus<EventMap>();
    expectTypeOf(bus.emit).parameter(0).toEqualTypeOf<EventName>();
    expectTypeOf(bus.on).parameter(0).toEqualTypeOf<EventName>();
    expectTypeOf(bus.off).parameter(0).toEqualTypeOf<EventName>();
  });

  it('payload types flow from EventMap', () => {
    expectTypeOf<EventMap['camera:recenter']>().toEqualTypeOf<Record<string, never>>();
    expectTypeOf<EventMap['combat:turn']>().toMatchTypeOf<{ turn: number; isPlayerTurn: boolean }>();
  });

  it('handlers receive inferred payload types', () => {
    const bus = createEventBus<EventMap>();
    bus.on('weather:snow', (payload) => {
      expectTypeOf(payload).toEqualTypeOf<EventMap['weather:snow']>();
    });
  });
});
