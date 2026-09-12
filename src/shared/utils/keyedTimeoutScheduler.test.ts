import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { KeyedTimeoutScheduler } from './keyedTimeoutScheduler';

/* ─── Этап 107: дедуп отложенных задач жизненного цикла оркестратора ─── */
describe('KeyedTimeoutScheduler', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('задача срабатывает один раз через заданную задержку', () => {
    const fn = vi.fn();
    const scheduler = new KeyedTimeoutScheduler();

    scheduler.schedule('a', fn, 1000);
    expect(scheduler.pendingCount).toBe(1);
    expect(scheduler.has('a')).toBe(true);

    vi.advanceTimersByTime(999);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(1);
    // Зрелая задача снимается с учёта сама.
    expect(scheduler.pendingCount).toBe(0);
    expect(scheduler.has('a')).toBe(false);
  });

  it('повторный schedule с тем же ключом заменяет незрелый таймер (дедуп)', () => {
    const first = vi.fn();
    const second = vi.fn();
    const scheduler = new KeyedTimeoutScheduler();

    scheduler.schedule('thought', first, 1200);
    vi.advanceTimersByTime(600);
    scheduler.schedule('thought', second, 1200);
    expect(scheduler.pendingCount).toBe(1);

    // К моменту «зрелости» первой задачи живёт уже заменённая — first не зовётся.
    vi.advanceTimersByTime(600);
    expect(first).not.toHaveBeenCalled();
    expect(second).not.toHaveBeenCalled();

    vi.advanceTimersByTime(600);
    expect(second).toHaveBeenCalledTimes(1);
    expect(first).toHaveBeenCalledTimes(0);
  });

  it('разные ключи не мешают друг другу', () => {
    const victory = vi.fn();
    const poem = vi.fn();
    const scheduler = new KeyedTimeoutScheduler();

    scheduler.schedule('thought:combat:victory', victory, 1200);
    scheduler.schedule('thought:poem', poem, 800);
    expect(scheduler.pendingCount).toBe(2);

    vi.advanceTimersByTime(800);
    expect(poem).toHaveBeenCalledTimes(1);
    expect(victory).not.toHaveBeenCalled();

    vi.advanceTimersByTime(400);
    expect(victory).toHaveBeenCalledTimes(1);
    expect(scheduler.pendingCount).toBe(0);
  });

  it('disposeAll снимает все незрелые таймеры (unmount/HMR)', () => {
    const a = vi.fn();
    const b = vi.fn();
    const scheduler = new KeyedTimeoutScheduler();

    scheduler.schedule('x', a, 500);
    scheduler.schedule('y', b, 900);
    scheduler.disposeAll();
    expect(scheduler.pendingCount).toBe(0);

    vi.advanceTimersByTime(2000);
    expect(a).not.toHaveBeenCalled();
    expect(b).not.toHaveBeenCalled();
  });

  it('cancel точечен: чужие таймеры продолжают жить', () => {
    const a = vi.fn();
    const b = vi.fn();
    const scheduler = new KeyedTimeoutScheduler();

    scheduler.schedule('keep', a, 300);
    scheduler.schedule('drop', b, 300);
    scheduler.cancel('drop');

    vi.advanceTimersByTime(300);
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).not.toHaveBeenCalled();
  });
});
