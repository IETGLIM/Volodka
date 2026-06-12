import { describe, expect, it, vi, beforeEach } from 'vitest';
import { eventBus } from '@/engine/EventBus';
import {
  performSceneTransition,
  resetSceneTransitionGuard,
} from './SceneTransitionManager';
import { registerGlobalCleanup, resetGlobalCleanupRegistry } from './GlobalCleanupService';

const dispatchGameAction = vi.fn();

vi.mock('@/engine/interaction/narrativeOpenHelpers', () => ({
  triggerSceneEntryStoryIfNeeded: vi.fn(),
}));

vi.mock('@/engine/GameActionDispatcher', () => ({
  getGameSnapshot: () => ({
    exploration: { currentSceneId: 'volodka_room' },
    showStoryOverlay: false,
  }),
  dispatchGameAction: (...args: unknown[]) => dispatchGameAction(...args),
}));

describe('SceneTransitionManager', () => {
  beforeEach(() => {
    dispatchGameAction.mockClear();
    resetSceneTransitionGuard();
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
      type: 'exploration/applySceneTransition',
      targetScene: 'cafe_evening',
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
    resetGlobalCleanupRegistry();
  });

  it('drops re-entrant performSceneTransition from unload listeners', () => {
    resetGlobalCleanupRegistry();
    let unloadCount = 0;

    const unsubUnload = eventBus.on('scene:unload', () => {
      unloadCount += 1;
      performSceneTransition({
        targetScene: 'office_day',
        spawnAt: [0, 0, 0],
      });
    });

    performSceneTransition({
      targetScene: 'street_night',
      spawnAt: [2, 0, 1],
    });

    expect(unloadCount).toBe(1);
    expect(dispatchGameAction).toHaveBeenCalledTimes(1);
    expect(dispatchGameAction).toHaveBeenCalledWith({
      type: 'exploration/applySceneTransition',
      targetScene: 'street_night',
      spawnAt: [2, 0, 1],
    });
    unsubUnload();
    resetGlobalCleanupRegistry();
  });
});
