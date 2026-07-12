import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  buildKarmaShiftAnnouncement,
  buildKarmaShiftLabel,
  buildStatChangeAnnouncement,
  computeStatChangePosition,
  getLevelUpParticleCount,
} from '@/engine/microAnimations/microAnimationsPresentation';
import { createNotificationPoolStore } from '@/hooks/useNotificationPool';

describe('microAnimationsPresentation', () => {
  it('builds stat change announcement', () => {
    expect(buildStatChangeAnnouncement('Код', 5)).toBe('Изменение: +5 Код');
  });

  it('builds karma labels by threshold', () => {
    expect(buildKarmaShiftLabel(3, 80)).toBe('Свет');
    expect(buildKarmaShiftLabel(-2, 20)).toBe('Тьма');
    expect(buildKarmaShiftAnnouncement(-1, 50)).toContain('Тень');
  });

  it('computes stat position SSR-safe', () => {
    expect(computeStatChangePosition(0)).toEqual({ x: 0, y: 0 });
  });

  it('reduces level-up particles on low tier', () => {
    expect(getLevelUpParticleCount('low', false)).toBe(0);
    expect(getLevelUpParticleCount('high', false)).toBe(16);
    expect(getLevelUpParticleCount('high', true)).toBe(0);
  });
});

describe('useNotificationPool store', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('adds and expires entries', () => {
    type Entry = { id: number; createdAt: number; label: string };
    const store = createNotificationPoolStore<Entry>();
    const listener = vi.fn();
    store.subscribe(listener);

    store.push({ label: 'test' }, { ttlMs: 1000, maxSize: 3, cleanupIntervalMs: 200 });
    expect(store.getSnapshot()).toHaveLength(1);
    expect(listener).toHaveBeenCalled();

    vi.advanceTimersByTime(1200);
    vi.advanceTimersByTime(200);
    expect(store.getSnapshot()).toHaveLength(0);
  });

  it('caps pool size', () => {
    type Entry = { id: number; createdAt: number; n: number };
    const store = createNotificationPoolStore<Entry>();
    for (let i = 0; i < 5; i++) {
      store.push({ n: i }, { ttlMs: 5000, maxSize: 2, cleanupIntervalMs: 200 });
    }
    expect(store.getSnapshot()).toHaveLength(2);
    expect(store.getSnapshot()[0]!.n).toBe(3);
  });
});
