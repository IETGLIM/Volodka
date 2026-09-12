import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { activeUiTickersForTests, onUiTick } from './useUiTick';

/* ─── Единый UI-clock: императивный API (v4.25, этап 104) ───
 *
 * onUiTick подключает колбэк к общему тикеру периода: один интервал на
 * частоту, авто-старт при первой подписке и авто-стоп при последней отписке.
 * Период ≤0 — «выключенная» подписка (гард латентного busy-loop бага).
 *
 * Каждый тест использует СВОЙ период, чтобы не пересекаться по
 * модулю-глобальному реестру тикеров.
 */
describe('useUiTick / onUiTick — единый UI-clock', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('период ≤0 — подписки нет, интервал не запускается, отписка no-op', () => {
    const cb = vi.fn();
    const unsub0 = onUiTick(0, cb);
    const unsubNegative = onUiTick(-1000, cb);

    expect(activeUiTickersForTests()).toBe(0);
    vi.advanceTimersByTime(5000);
    expect(cb).not.toHaveBeenCalled();

    expect(() => {
      unsub0();
      unsubNegative();
    }).not.toThrow();
    expect(activeUiTickersForTests()).toBe(0);
  });

  it('колбэк тикает с заданным периодом', () => {
    const cb = vi.fn();
    const unsub = onUiTick(1000, cb);

    vi.advanceTimersByTime(1000);
    expect(cb).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(2000);
    expect(cb).toHaveBeenCalledTimes(3);

    unsub();
    vi.advanceTimersByTime(5000);
    expect(cb).toHaveBeenCalledTimes(3);
  });

  it('два подписчика одного периода делят один тикер', () => {
    const a = vi.fn();
    const b = vi.fn();
    const unsubA = onUiTick(250, a);
    expect(activeUiTickersForTests()).toBe(1);

    const unsubB = onUiTick(250, b);
    expect(activeUiTickersForTests()).toBe(1);

    vi.advanceTimersByTime(250);
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);

    unsubA();
    vi.advanceTimersByTime(250);
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(2);

    unsubB();
    expect(activeUiTickersForTests()).toBe(0);
  });

  it('после полной отписки тикер перезапускается при новой подписке', () => {
    const cb = vi.fn();
    const first = onUiTick(700, cb);
    first();
    expect(activeUiTickersForTests()).toBe(0);

    const second = onUiTick(700, cb);
    expect(activeUiTickersForTests()).toBe(1);
    vi.advanceTimersByTime(700);
    expect(cb).toHaveBeenCalledTimes(1);
    second();
    expect(activeUiTickersForTests()).toBe(0);
  });
});
