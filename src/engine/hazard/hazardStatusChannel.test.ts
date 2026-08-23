/* ─── Юнит-тесты канала активной hazard-зоны (3D → HUD) ─── */
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  clearHazardStatus,
  getHazardStatus,
  markHazardTick,
  resetHazardStatusForTests,
  setHazardStatus,
  subscribeToHazardStatus,
} from '@/engine/hazard/hazardStatusChannel';

const SAMPLE = {
  hazardId: 'factory_electric_panel',
  kind: 'electric' as const,
  label: 'Электричество',
  stressPerTick: 8,
  tickInterval: 1.2,
};

afterEach(() => {
  resetHazardStatusForTests();
  vi.restoreAllMocks();
});

describe('hazardStatusChannel', () => {
  it('starts empty and publishes snapshot on set', () => {
    expect(getHazardStatus()).toBeNull();

    const listener = vi.fn();
    const unsub = subscribeToHazardStatus(listener);
    setHazardStatus(SAMPLE);

    const snap = getHazardStatus();
    expect(snap).not.toBeNull();
    expect(snap!.hazardId).toBe(SAMPLE.hazardId);
    expect(snap!.stressPerTick).toBe(8);
    expect(snap!.tickInterval).toBe(1.2);
    expect(listener).toHaveBeenCalledTimes(1);
    unsub();
  });

  it('does not notify when the same zone is re-published', () => {
    const listener = vi.fn();
    const unsub = subscribeToHazardStatus(listener);
    setHazardStatus(SAMPLE);
    setHazardStatus(SAMPLE);
    expect(listener).toHaveBeenCalledTimes(1);
    unsub();
  });

  it('updates lastTickAt on tick without notifying HUD', () => {
    setHazardStatus(SAMPLE);
    const before = getHazardStatus()!.lastTickAt;

    const listener = vi.fn();
    const unsub = subscribeToHazardStatus(listener);
    markHazardTick();
    expect(getHazardStatus()!.lastTickAt).toBeGreaterThanOrEqual(before);
    expect(listener).not.toHaveBeenCalled();
    unsub();
  });

  it('clears on leave and notifies once', () => {
    setHazardStatus(SAMPLE);
    const listener = vi.fn();
    const unsub = subscribeToHazardStatus(listener);

    clearHazardStatus();
    expect(getHazardStatus()).toBeNull();
    expect(listener).toHaveBeenCalledTimes(1);

    // Повторный clear уже ничего не рассылает.
    clearHazardStatus();
    expect(listener).toHaveBeenCalledTimes(1);
    unsub();
  });

  it('stops notifications after unsubscribe', () => {
    const listener = vi.fn();
    const unsub = subscribeToHazardStatus(listener);
    unsub();
    setHazardStatus(SAMPLE);
    expect(listener).not.toHaveBeenCalled();
  });
});
