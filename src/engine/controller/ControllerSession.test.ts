import { describe, expect, it, vi } from 'vitest';
import { ControllerSession } from './ControllerSession';

describe('ControllerSession', () => {
  it('drops stale scheduled callbacks after dispose', () => {
    vi.useFakeTimers();
    const session = new ControllerSession();
    session.begin();
    const gen = session.getGeneration();
    const fn = vi.fn();

    session.schedule(fn, 100);
    session.dispose();
    expect(session.isCurrent(gen)).toBe(false);

    vi.advanceTimersByTime(100);
    expect(fn).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('runs callback when generation still matches', () => {
    vi.useFakeTimers();
    const session = new ControllerSession();
    session.begin();
    const fn = vi.fn();

    session.schedule(fn, 50);
    vi.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('cancel drops pending work without marking session disposed', () => {
    vi.useFakeTimers();
    const session = new ControllerSession();
    session.begin();
    const gen = session.getGeneration();
    const fn = vi.fn();

    session.schedule(fn, 100);
    session.cancel();
    expect(session.isDisposed()).toBe(false);
    expect(session.isCurrent(gen)).toBe(false);

    vi.advanceTimersByTime(100);
    expect(fn).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('clearTimers cancels pending work without bumping generation', () => {
    vi.useFakeTimers();
    const session = new ControllerSession();
    const gen = session.begin();
    const fn = vi.fn();

    session.schedule(fn, 100);
    session.clearTimers();
    vi.advanceTimersByTime(100);
    expect(fn).not.toHaveBeenCalled();
    expect(session.isCurrent(gen)).toBe(true);
    vi.useRealTimers();
  });
});
