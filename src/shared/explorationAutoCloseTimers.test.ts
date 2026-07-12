import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearAutoCloseTimers,
  getAutoCloseGeneration,
  isAutoCloseSchedulingSuspended,
  resumeAutoCloseTimers,
  suspendAutoCloseTimers,
  trackAutoCloseTimer,
} from './explorationAutoCloseTimers';

describe('explorationAutoCloseTimers', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resumeAutoCloseTimers();
  });

  afterEach(() => {
    resumeAutoCloseTimers();
    vi.useRealTimers();
  });

  it('clearAutoCloseTimers bumps generation so stale callbacks can no-op', () => {
    const gen = getAutoCloseGeneration();
    const callback = vi.fn();
    const timer = setTimeout(callback, 5000);
    trackAutoCloseTimer('door-a', timer, gen);

    clearAutoCloseTimers();
    vi.advanceTimersByTime(5000);

    expect(callback).not.toHaveBeenCalled();
    expect(getAutoCloseGeneration()).toBe(gen + 1);
  });

  it('trackAutoCloseTimer drops timers scheduled with a stale generation', () => {
    const gen = getAutoCloseGeneration();
    clearAutoCloseTimers();
    const callback = vi.fn();
    const timer = setTimeout(callback, 5000);
    trackAutoCloseTimer('door-b', timer, gen);

    vi.advanceTimersByTime(5000);
    expect(callback).not.toHaveBeenCalled();
  });

  it('suspendAutoCloseTimers blocks scheduling until resumeAutoCloseTimers', () => {
    const genBefore = getAutoCloseGeneration();
    suspendAutoCloseTimers();
    expect(isAutoCloseSchedulingSuspended()).toBe(true);
    expect(getAutoCloseGeneration()).toBe(genBefore + 1);

    resumeAutoCloseTimers();
    expect(isAutoCloseSchedulingSuspended()).toBe(false);
    expect(getAutoCloseGeneration()).toBe(genBefore + 2);
  });

  it('resumeAutoCloseTimers clears timers created during dispose dead zone', () => {
    const callback = vi.fn();
    const gen = getAutoCloseGeneration();
    suspendAutoCloseTimers();

    const timer = setTimeout(callback, 5000);
    trackAutoCloseTimer('door-c', timer, gen);

    resumeAutoCloseTimers();
    vi.advanceTimersByTime(5000);

    expect(callback).not.toHaveBeenCalled();
  });
});
