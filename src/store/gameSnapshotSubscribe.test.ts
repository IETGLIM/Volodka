import { describe, it, expect, vi } from 'vitest';
import '@/store/gameStore';
import { getGameSnapshot, subscribeGameSnapshot } from '@/shared/gameBridge/stateDispatcher';
import { useGameStore } from '@/store/gameStore';

describe('gameSnapshot subscribe', () => {
  it('memoizes snapshot per unchanged store state reference', () => {
    const first = getGameSnapshot();
    const second = getGameSnapshot();
    expect(second).toBe(first);
  });

  it('rebuilds snapshot when combined store state changes', () => {
    const before = getGameSnapshot();
    useGameStore.getState().setCurrentNodeId('snapshot_cache_probe');
    const after = getGameSnapshot();
    expect(after).not.toBe(before);
    expect(after.currentNodeId).toBe('snapshot_cache_probe');
  });

  it('selector subscribe passes selected value, not full snapshot', async () => {
    const listener = vi.fn();
    const unsub = subscribeGameSnapshot(listener, {
      selector: (snapshot) => snapshot.currentNodeId,
      equalityFn: (a, b) => a === b,
    });

    useGameStore.getState().setCurrentNodeId('test_node_alpha');
    await Promise.resolve();

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith('test_node_alpha');
    expect(typeof listener.mock.calls[0][0]).toBe('string');

    useGameStore.getState().setCurrentNodeId('test_node_alpha');
    await Promise.resolve();
    expect(listener).toHaveBeenCalledTimes(1);

    unsub();
  });
});
