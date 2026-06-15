import { describe, expect, it, vi, beforeEach } from 'vitest';
import { eventBus } from '@/engine/EventBus';
import {
  performSceneTransition,
  resetSceneTransitionGuard,
  isSceneTransitionInProgress,
} from './SceneTransitionManager';
import { registerGlobalCleanup, resetGlobalCleanupRegistry } from './GlobalCleanupService';
import { resetSceneLoadedGate } from './sceneLoadedGate';

const dispatchGameAction = vi.fn();

async function flushSceneLoaded(): Promise<void> {
  await Promise.resolve();
}

vi.mock('@/engine/interaction/narrativeOpenHelpers', () => ({
  triggerSceneEntryStoryIfNeeded: vi.fn(),
}));

vi.mock('@/shared/exploreHubNodes', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/exploreHubNodes')>();
  return {
    ...actual,
    syncNarrativeOnSceneEnter: vi.fn(),
  };
});

vi.mock('@/engine/guidedStory/createGuidedStoryDeps', () => ({
  getStoryNodeSceneId: () => undefined,
}));

vi.mock('@/engine/GameActionDispatcher', () => ({
  getGameSnapshot: () => ({
    exploration: { currentSceneId: 'volodka_room' },
    showStoryOverlay: false,
    currentNodeId: 'explore_mode',
  }),
  dispatchGameAction: (...args: unknown[]) => dispatchGameAction(...args),
}));

describe('SceneTransitionManager', () => {
  beforeEach(() => {
    dispatchGameAction.mockClear();
    resetSceneTransitionGuard();
    resetSceneLoadedGate();
  });

  it('emits unload → enter → loaded in order', async () => {
    resetGlobalCleanupRegistry();
    const order: string[] = [];

    const unsub = eventBus.on('scene:unload', () => order.push('unload'));
    eventBus.on('scene:transition_start', () => order.push('transition_start'));
    eventBus.on('scene:enter', () => order.push('enter'));
    eventBus.on('scene:loaded', () => order.push('loaded'));

    registerGlobalCleanup(() => order.push('cleanup'));

    performSceneTransition({
      targetScene: 'cafe_evening',
      spawnAt: [1, 0, 2],
    });

    expect(order).toEqual(['transition_start', 'unload', 'cleanup', 'enter']);
    await flushSceneLoaded();
    expect(order).toEqual(['transition_start', 'unload', 'cleanup', 'enter', 'loaded']);
    expect(dispatchGameAction).toHaveBeenCalledWith({
      type: 'exploration/applySceneTransition',
      targetScene: 'cafe_evening',
      spawnAt: [1, 0, 2],
    });
    unsub();
    resetGlobalCleanupRegistry();
  });

  it('skips unload when target equals current scene', async () => {
    resetGlobalCleanupRegistry();
    const order: string[] = [];

    eventBus.on('scene:unload', () => order.push('unload'));
    eventBus.on('scene:transition_start', () => order.push('transition_start'));
    eventBus.on('scene:enter', () => order.push('enter'));
    eventBus.on('scene:loaded', () => order.push('loaded'));

    performSceneTransition({
      targetScene: 'volodka_room',
      spawnAt: [0, 0, 0],
    });

    expect(order).toEqual(['transition_start', 'enter']);
    await flushSceneLoaded();
    expect(order).toEqual(['transition_start', 'enter', 'loaded']);
    resetGlobalCleanupRegistry();
  });

  it('keeps async transition guard set until scene:loaded', async () => {
    performSceneTransition({
      targetScene: 'cafe_evening',
      spawnAt: [1, 0, 2],
    });

    expect(isSceneTransitionInProgress()).toBe(true);
    await flushSceneLoaded();
    expect(isSceneTransitionInProgress()).toBe(false);
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
