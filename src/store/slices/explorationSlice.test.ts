import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useGameStore } from '@/store/gameStore';
import { clearAutoCloseTimers } from './explorationSlice';

describe('explorationSlice interactive object state', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    clearAutoCloseTimers();
    useGameStore.setState({ interactiveObjectStates: {} });
  });

  afterEach(() => {
    clearAutoCloseTimers();
    vi.useRealTimers();
  });

  it('toggleInteractiveObject auto-closes visual doors after 5 seconds', () => {
    useGameStore.getState().toggleInteractiveObject('room_door');
    expect(useGameStore.getState().interactiveObjectStates.room_door).toBe(true);

    vi.advanceTimersByTime(5000);
    expect(useGameStore.getState().interactiveObjectStates.room_door).toBe(false);
  });

  it('consumeInteractiveObject stays consumed (one-time loot zones)', () => {
    useGameStore.getState().consumeInteractiveObject('solnysh_wine_closet');
    expect(useGameStore.getState().interactiveObjectStates.solnysh_wine_closet).toBe(true);

    vi.advanceTimersByTime(5000);
    expect(useGameStore.getState().interactiveObjectStates.solnysh_wine_closet).toBe(true);
  });
});
