import { describe, it, expect, vi } from 'vitest';
import '@/store/gameStore';
import { getGameSnapshot, subscribeGameSnapshot } from '@/engine/GameActionDispatcher';
import { useGameStore } from '@/store/gameStore';

describe('gameSnapshot subscribe', () => {
  it('memoizes snapshot per unchanged store state reference', () => {
    const first = getGameSnapshot();
    const second = getGameSnapshot();
    expect(second).toBe(first);
  });

  it('selector subscribe passes selected value, not full snapshot', () => {
    const listener = vi.fn();
    const unsub = subscribeGameSnapshot(listener, {
      selector: (snapshot) => snapshot.currentNodeId,
      equalityFn: (a, b) => a === b,
    });

    useGameStore.getState().setCurrentNodeId('test_node_alpha');

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith('test_node_alpha');
    expect(typeof listener.mock.calls[0][0]).toBe('string');

    useGameStore.getState().setCurrentNodeId('test_node_alpha');
    expect(listener).toHaveBeenCalledTimes(1);

    unsub();
  });
});
