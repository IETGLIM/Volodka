import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { eventBus } from '@/engine/EventBus';
import { useAppStore } from '@/state/appStore';
import { useAutoSave } from './useAutoSave';

const saveGame = vi.fn();

vi.mock('@/state', () => ({
  useGameStore: (sel: (s: { saveGame: typeof saveGame }) => unknown) =>
    sel({ saveGame }),
}));

describe('useAutoSave', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    saveGame.mockClear();
    useAppStore.setState({ phase: 'game' });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('forces save after debounce even when minDelayMs would skip interval tick', async () => {
    renderHook(() =>
      useAutoSave({
        intervalMs: 60_000,
        saveOnSceneChange: true,
        saveOnChoice: false,
        minDelayMs: 30_000,
        debounceMs: 5_000,
      }),
    );

    await act(async () => {
      eventBus.emit('scene:enter', { sceneId: 'kitchen_night' });
    });
    await act(async () => {
      vi.advanceTimersByTime(5_000);
    });
    expect(saveGame).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(60_000);
    });
    expect(saveGame).toHaveBeenCalledTimes(2);

    await act(async () => {
      eventBus.emit('scene:enter', { sceneId: 'volodka_room' });
    });
    await act(async () => {
      vi.advanceTimersByTime(5_000);
    });
    expect(saveGame).toHaveBeenCalledTimes(3);
  });
});
