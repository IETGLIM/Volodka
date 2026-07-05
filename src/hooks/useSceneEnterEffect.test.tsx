import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { eventBus } from '@/engine/EventBus';
import { useSceneEnterEffect } from '@/hooks/useSceneEnterEffect';

const SCENE_ENTER = {
  fromSceneId: 'volodka_room',
  sceneId: 'volodka_corridor',
} as const;

describe('useSceneEnterEffect', () => {
  it('invokes handler on scene:enter', () => {
    const handler = vi.fn();
    renderHook(() => useSceneEnterEffect(handler));

    eventBus.emit('scene:enter', SCENE_ENTER);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith('volodka_corridor');
  });

  it('uses the latest handler without resubscribing', () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = renderHook(({ fn }) => useSceneEnterEffect(fn), {
      initialProps: { fn: first },
    });

    rerender({ fn: second });
    eventBus.emit('scene:enter', { fromSceneId: 'volodka_corridor', sceneId: 'library_day' });

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith('library_day');
  });

  it('unsubscribes on unmount', () => {
    const handler = vi.fn();
    const { unmount } = renderHook(() => useSceneEnterEffect(handler));

    unmount();
    eventBus.emit('scene:enter', SCENE_ENTER);

    expect(handler).not.toHaveBeenCalled();
  });
});
