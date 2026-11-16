import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearAutoCloseTimers,
  resumeAutoCloseTimers,
} from '@/shared/explorationAutoCloseTimers';
import { useExplorationStore } from '../stores/explorationStore';

describe('one-time interactive objects stay consumed', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resumeAutoCloseTimers();
    useExplorationStore.setState({ interactiveObjectStates: {} });
  });

  afterEach(() => {
    clearAutoCloseTimers();
    vi.useRealTimers();
  });

  it('still auto-closes a toggled door after 5 seconds', () => {
    useExplorationStore.getState().toggleInteractiveObject('room_door');
    expect(useExplorationStore.getState().interactiveObjectStates.room_door).toBe(true);

    vi.advanceTimersByTime(5000);

    expect(useExplorationStore.getState().interactiveObjectStates.room_door).toBe(false);
  });

  it('does not reopen a consumed one-time zone when the door timer elapses', () => {
    useExplorationStore.getState().consumeInteractiveObject('solnysh_wine_closet');
    expect(useExplorationStore.getState().interactiveObjectStates.solnysh_wine_closet).toBe(true);

    vi.advanceTimersByTime(5000);

    expect(useExplorationStore.getState().interactiveObjectStates.solnysh_wine_closet).toBe(true);
  });

  it('cancels a pending auto-close so a later consume cannot be undone', () => {
    useExplorationStore.getState().toggleInteractiveObject('pier_portwine_crate');
    useExplorationStore.getState().consumeInteractiveObject('pier_portwine_crate');

    vi.advanceTimersByTime(5000);

    expect(useExplorationStore.getState().interactiveObjectStates.pier_portwine_crate).toBe(true);
  });
});
