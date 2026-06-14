import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@/store/gameStore';
import {
  scheduleAfterSliceStoresSettle,
  resetSliceMutationSchedulerForTests,
  subscribeAllStores,
} from './combinedState';
import { usePlayerStore } from './stores/playerStore';
import { useUIStore } from './stores/uiStore';
import { useGameStore } from './gameStore';

describe('subscribeAllStores', () => {
  it('batches multiple slice updates into one microtask notification', async () => {
    const listener = vi.fn();
    const unsub = subscribeAllStores(listener);

    const menuOpen = useUIStore.getState().mainMenuOpen;
    const energy = usePlayerStore.getState().energy;
    usePlayerStore.setState({ energy: energy - 1 });
    useUIStore.setState({ mainMenuOpen: !menuOpen });

    expect(listener).not.toHaveBeenCalled();

    await Promise.resolve();
    expect(listener).toHaveBeenCalledTimes(1);

    usePlayerStore.setState({ energy });
    useUIStore.setState({ mainMenuOpen: menuOpen });
    unsub();
  });
});

describe('scheduleAfterSliceStoresSettle', () => {
  beforeEach(() => {
    resetSliceMutationSchedulerForTests();
  });

  afterEach(() => {
    resetSliceMutationSchedulerForTests();
    vi.unstubAllGlobals();
  });

  it('coalesces callbacks from separate macrotasks into one animation frame', async () => {
    const rafQueue: FrameRequestCallback[] = [];
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      rafQueue.push(cb);
      return rafQueue.length;
    });

    const callback = vi.fn();
    scheduleAfterSliceStoresSettle(callback);

    await new Promise<void>((resolve) => {
      setTimeout(() => {
        scheduleAfterSliceStoresSettle(callback);
        resolve();
      }, 0);
    });

    expect(callback).not.toHaveBeenCalled();
    expect(rafQueue).toHaveLength(1);

    rafQueue[0]?.(0);
    expect(callback).toHaveBeenCalledTimes(1);
  });
});

describe('gameStore facade flush', () => {
  it('coalesces facade updates from separate macrotasks into one animation frame', async () => {
    resetSliceMutationSchedulerForTests();

    const rafQueue: FrameRequestCallback[] = [];
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      rafQueue.push(cb);
      return rafQueue.length;
    });

    const facadeListener = vi.fn();
    const unsub = useGameStore.subscribe(facadeListener);
    facadeListener.mockClear();

    const menuOpen = useUIStore.getState().mainMenuOpen;
    const energy = usePlayerStore.getState().energy;

    await new Promise<void>((resolve) => {
      setTimeout(() => {
        usePlayerStore.setState({ energy: energy - 1 });
        setTimeout(() => {
          useUIStore.setState({ mainMenuOpen: !menuOpen });
          resolve();
        }, 0);
      }, 0);
    });

    await Promise.resolve();
    expect(facadeListener).not.toHaveBeenCalled();
    expect(rafQueue).toHaveLength(1);

    rafQueue[0]?.(0);
    expect(facadeListener).toHaveBeenCalledTimes(1);

    usePlayerStore.setState({ energy });
    useUIStore.setState({ mainMenuOpen: menuOpen });
    unsub();
  });
});
