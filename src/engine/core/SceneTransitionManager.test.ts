import { describe, expect, it, vi } from 'vitest';
import { eventBus } from '@/engine/EventBus';
import { performSceneTransition } from './SceneTransitionManager';
import { registerGlobalCleanup, resetGlobalCleanupRegistry } from './GlobalCleanupService';

vi.mock('@/store/gameStore', () => ({
  getGameStore: () => ({
    exploration: { currentSceneId: 'volodka_room' },
    setExplorationScene: vi.fn(),
    setPlayerPosition: vi.fn(),
    discoverScene: vi.fn(),
    autoRegenBetweenScenes: vi.fn(),
  }),
}));

describe('SceneTransitionManager', () => {
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
});
