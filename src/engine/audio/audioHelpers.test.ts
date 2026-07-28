import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { fillDecayedNoise, fillWhiteNoise } from './audioNoiseBuffers';
import {
  createDeferredCleanupHandle,
  flushDeferredCleanup,
  scheduleDeferredCleanup,
} from './deferredNodeCleanup';
import { barkBaseFrequency } from './proceduralSpatial';
import { nextLegacyRandomDelayMs, nextRandomSoundDelayMs } from './proceduralAmbient';

describe('audioNoiseBuffers', () => {
  it('fillDecayedNoise stays in [-1, 1] and decays toward zero', () => {
    const data = new Float32Array(64);
    fillDecayedNoise(data, 12);
    expect(Math.max(...data)).toBeLessThanOrEqual(1);
    expect(Math.min(...data)).toBeGreaterThanOrEqual(-1);
    const early = Math.abs(data[0]);
    const late = Math.abs(data[data.length - 1]);
    expect(late).toBeLessThan(early);
  });

  it('fillWhiteNoise respects amplitude scale', () => {
    const data = new Float32Array(32);
    fillWhiteNoise(data, 0.5);
    expect(Math.max(...data.map(Math.abs))).toBeLessThanOrEqual(0.5 + 1e-9);
  });
});

describe('deferredNodeCleanup', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('scheduleDeferredCleanup runs immediately when immediate=true', () => {
    const handle = createDeferredCleanupHandle();
    const release = vi.fn();
    scheduleDeferredCleanup(handle, release, 600, true);
    expect(release).toHaveBeenCalledOnce();
    expect(handle.timer).toBeNull();
  });

  it('scheduleDeferredCleanup defers then clears handle', () => {
    const handle = createDeferredCleanupHandle();
    const release = vi.fn();
    scheduleDeferredCleanup(handle, release, 600, false);
    expect(release).not.toHaveBeenCalled();
    vi.advanceTimersByTime(600);
    expect(release).toHaveBeenCalledOnce();
    expect(handle.timer).toBeNull();
    expect(handle.cleanup).toBeNull();
  });

  it('flushDeferredCleanup cancels timer and runs pending cleanup', () => {
    const handle = createDeferredCleanupHandle();
    const release = vi.fn();
    scheduleDeferredCleanup(handle, release, 1000, false);
    flushDeferredCleanup(handle);
    expect(release).toHaveBeenCalledOnce();
    vi.advanceTimersByTime(1000);
    expect(release).toHaveBeenCalledOnce();
  });
});

describe('proceduralSpatial barkBaseFrequency', () => {
  it('maps text hash into 150–249 Hz', () => {
    expect(barkBaseFrequency('a')).toBeGreaterThanOrEqual(150);
    expect(barkBaseFrequency('a')).toBeLessThan(250);
    expect(barkBaseFrequency('hello')).toBe(barkBaseFrequency('hello'));
    expect(barkBaseFrequency('hello')).not.toBe(barkBaseFrequency('world'));
  });
});

describe('proceduralAmbient delay helpers', () => {
  it('nextLegacyRandomDelayMs stays within 0.8–1.2× interval', () => {
    for (let i = 0; i < 20; i++) {
      const ms = nextLegacyRandomDelayMs(10);
      expect(ms).toBeGreaterThanOrEqual(8000);
      expect(ms).toBeLessThanOrEqual(12000);
    }
  });

  it('nextRandomSoundDelayMs stays within jittered [min,max] window', () => {
    const soundDef = {
      type: 'sine' as const,
      frequency: 440,
      duration: 0.1,
      gain: 0.1,
      minInterval: 5,
      maxInterval: 5,
    };
    for (let i = 0; i < 20; i++) {
      const ms = nextRandomSoundDelayMs(soundDef);
      expect(ms).toBeGreaterThanOrEqual(4000);
      expect(ms).toBeLessThanOrEqual(6000);
    }
  });
});
