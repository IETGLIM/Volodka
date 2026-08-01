import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { eventBus } from '@/engine/EventBus';
import { useCutsceneStore } from '@/store/stores/cutsceneStore';
import { useSceneLoadedGate } from './useSceneLoadedGate';

describe('useSceneLoadedGate', () => {
  beforeEach(() => {
    useCutsceneStore.getState().setCutscene(null, []);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('stays false during intro_wakeup even after scene:loaded or 3s fallback', () => {
    useCutsceneStore.getState().setCutscene('intro_wakeup', []);
    const { result } = renderHook(() => useSceneLoadedGate('volodka_room'));

    act(() => {
      eventBus.emit('scene:loaded', {
        sceneId: 'volodka_room',
        fromSceneId: 'volodka_room',
      });
    });
    expect(result.current).toBe(false);

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current).toBe(false);
  });

  it('settles after wake clears and finishIntroWake emits scene:loaded', () => {
    useCutsceneStore.getState().setCutscene('intro_wakeup', []);
    const { result } = renderHook(() => useSceneLoadedGate('volodka_room'));
    expect(result.current).toBe(false);

    act(() => {
      useCutsceneStore.getState().setCutscene(null, []);
      eventBus.emit('scene:loaded', {
        sceneId: 'volodka_room',
        fromSceneId: 'volodka_room',
      });
    });
    expect(result.current).toBe(true);
  });

  it('re-arms on game:playthrough_reset so menu-preloaded loaded cannot leak', () => {
    const { result } = renderHook(() => useSceneLoadedGate('volodka_room'));

    act(() => {
      eventBus.emit('scene:loaded', {
        sceneId: 'volodka_room',
        fromSceneId: 'volodka_room',
      });
    });
    expect(result.current).toBe(true);

    act(() => {
      eventBus.emit('game:playthrough_reset', {});
    });
    expect(result.current).toBe(false);
  });
});
