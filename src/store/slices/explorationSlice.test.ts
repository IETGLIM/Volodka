import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useGameStore } from '../gameStore';
import { clearAutoCloseTimers } from './explorationSlice';

describe('toggleInteractiveObject', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    clearAutoCloseTimers();
    useGameStore.setState({ interactiveObjectStates: {} });
  });

  afterEach(() => {
    clearAutoCloseTimers();
    vi.useRealTimers();
  });

  it('auto-closes temporary objects after 5 seconds', () => {
    const { toggleInteractiveObject } = useGameStore.getState();

    toggleInteractiveObject('room_door');
    expect(useGameStore.getState().interactiveObjectStates.room_door).toBe(true);

    vi.advanceTimersByTime(5000);
    expect(useGameStore.getState().interactiveObjectStates.room_door).toBe(false);
  });

  it('keeps persisted one-time trigger zones marked after 5 seconds', () => {
    const { toggleInteractiveObject } = useGameStore.getState();

    toggleInteractiveObject('room_window', { persist: true });
    expect(useGameStore.getState().interactiveObjectStates.room_window).toBe(true);

    vi.advanceTimersByTime(5000);
    expect(useGameStore.getState().interactiveObjectStates.room_window).toBe(true);
  });
});
