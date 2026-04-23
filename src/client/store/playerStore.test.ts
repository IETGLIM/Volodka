import { describe, it, expect, vi, beforeEach } from 'vitest';
import { eventBus } from '@/engine/EventBus';
import { usePlayerStore } from './playerStore';

describe('playerStore', () => {
  beforeEach(() => {
    usePlayerStore.getState().resetPlayer();
  });

  it('addStat ignores NaN', () => {
    const moodBefore = usePlayerStore.getState().playerState.mood;
    usePlayerStore.getState().addStat('mood', Number.NaN);
    expect(usePlayerStore.getState().playerState.mood).toBe(moodBefore);
  });

  it('updateStatsBatch applies multiple stats in one set', () => {
    usePlayerStore.getState().updateStatsBatch({ mood: 10, creativity: 20, stress: 85 });
    const s = usePlayerStore.getState().playerState;
    expect(s.mood).toBe(10);
    expect(s.creativity).toBe(20);
    expect(s.stress).toBe(85);
    expect(s.panicMode).toBe(false);
  });

  it('emits player:stress_high when crossing 80', () => {
    const spy = vi.fn();
    const off = eventBus.on('player:stress_high', spy);
    usePlayerStore.getState().addStress(85);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0]).toMatchObject({ stress: 85, previousStress: 0 });
    off();
  });

  it('emits panic enter and leave', () => {
    const enter = vi.fn();
    const leave = vi.fn();
    const o1 = eventBus.on('player:panic_enter', enter);
    const o2 = eventBus.on('player:panic_leave', leave);
    usePlayerStore.getState().addStress(100);
    expect(enter).toHaveBeenCalledTimes(1);
    usePlayerStore.getState().reduceStress(50);
    expect(leave).toHaveBeenCalled();
    o1();
    o2();
  });

  it('setRpgProgress updates experience fields', () => {
    usePlayerStore.getState().setRpgProgress(120, 3, 200);
    const s = usePlayerStore.getState().playerState;
    expect(s.experience).toBe(120);
    expect(s.characterLevel).toBe(3);
    expect(s.experienceToNextLevel).toBe(200);
  });

  it('serialize/deserialize roundtrip keeps core stats', () => {
    usePlayerStore.getState().updateStatsBatch({ mood: 77, energy: 18 });
    const snap = usePlayerStore.getState().serializePlayerState();
    usePlayerStore.getState().resetPlayer();
    usePlayerStore.getState().deserializePlayerState({ mood: snap.mood, energy: snap.energy });
    const s = usePlayerStore.getState().playerState;
    expect(s.mood).toBe(77);
    expect(s.energy).toBe(18);
  });
});
