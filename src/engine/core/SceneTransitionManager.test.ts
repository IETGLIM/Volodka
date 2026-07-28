import { describe, expect, it, vi, beforeEach } from 'vitest';
import { eventBus } from '@/engine/EventBus';
import { registerGlobalCleanup, resetGlobalCleanupRegistry } from './GlobalCleanupService';

const getGameSnapshot = vi.fn();
const dispatchGameAction = vi.fn();

vi.mock('@/engine/GameActionDispatcher', () => ({
  getGameSnapshot: (...args: unknown[]) => getGameSnapshot(...args),
  dispatchGameAction: (...args: unknown[]) => dispatchGameAction(...args),
}));

import { performSceneTransition } from './SceneTransitionManager';

describe('SceneTransitionManager', () => {
  beforeEach(() => {
    getGameSnapshot.mockReset();
    dispatchGameAction.mockReset();
    getGameSnapshot.mockReturnValue({
      exploration: { currentSceneId: 'volodka_room' },
    });
  });

  it('emits unload → enter → loaded in order', () => {
    resetGlobalCleanupRegistry();
    const order: string[] = [];

    const unsub = eventBus.on('scene:unload', () => order.push('unload'));
    eventBus.on('scene:enter', () => order.push('enter'));
    eventBus.on('scene:loaded', () => order.push('loaded'));

    registerGlobalCleanup(() => order.push('cleanup'));

    performSceneTransition({
      targetScene: 'cafe_evening',
      spawnAt: [1, 0, 2],
    });

    expect(order).toEqual(['unload', 'cleanup', 'enter', 'loaded']);
    expect(dispatchGameAction).toHaveBeenCalledWith({
      type: 'exploration/commitSceneTransition',
      sceneId: 'cafe_evening',
      spawnAt: [1, 0, 2],
    });
    unsub();
    resetGlobalCleanupRegistry();
  });

  it('skips unload when target equals current scene', () => {
    resetGlobalCleanupRegistry();
    const order: string[] = [];

    eventBus.on('scene:unload', () => order.push('unload'));
    eventBus.on('scene:enter', () => order.push('enter'));
    eventBus.on('scene:loaded', () => order.push('loaded'));

    performSceneTransition({
      targetScene: 'volodka_room',
      spawnAt: [0, 0, 0],
    });

    expect(order).toEqual(['enter', 'loaded']);
    expect(dispatchGameAction).toHaveBeenCalledWith({
      type: 'exploration/commitSceneTransition',
      sceneId: 'volodka_room',
      spawnAt: [0, 0, 0],
    });
    resetGlobalCleanupRegistry();
  });
});
