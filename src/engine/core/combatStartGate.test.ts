import { describe, expect, it, vi, beforeEach } from 'vitest';
import { eventBus } from '@/engine/EventBus';
import {
  deferCombatStartIfTransitionBusy,
  flushDeferredCombatStart,
  registerCombatStartExecutor,
  resetCombatStartGate,
} from './combatStartGate';
import {
  performSceneTransition,
  resetSceneTransitionGuard,
  isSceneTransitionInProgress,
} from './SceneTransitionManager';
import { resetGlobalCleanupRegistry } from './GlobalCleanupService';
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

describe('combatStartGate', () => {
  beforeEach(() => {
    resetCombatStartGate();
    resetSceneTransitionGuard();
    resetSceneLoadedGate();
    resetGlobalCleanupRegistry();
    dispatchGameAction.mockClear();
  });

  it('defers combat during performSceneTransition and flushes after scene:loaded', async () => {
    const order: string[] = [];
    const executor = vi.fn(() => order.push('combat'));

    registerCombatStartExecutor(executor);

    eventBus.on('scene:enter', () => {
      order.push('enter');
      deferCombatStartIfTransitionBusy('system_daemon');
    });
    eventBus.on('scene:loaded', () => order.push('loaded'));

    performSceneTransition({
      targetScene: 'battle',
      spawnAt: [0, 0, 0],
    });

    expect(order).toEqual(['enter']);
    await flushSceneLoaded();
    expect(order).toEqual(['enter', 'loaded', 'combat']);
    expect(executor).toHaveBeenCalledTimes(1);
    expect(executor).toHaveBeenCalledWith('system_daemon', undefined);
  });

  it('defers combat in the async gap after performSceneTransition returns', async () => {
    const order: string[] = [];
    const executor = vi.fn(() => order.push('combat'));

    registerCombatStartExecutor(executor);

    performSceneTransition({
      targetScene: 'battle',
      spawnAt: [0, 0, 0],
    });

    expect(isSceneTransitionInProgress()).toBe(true);
    expect(deferCombatStartIfTransitionBusy('system_daemon')).toBe(true);

    await flushSceneLoaded();
    expect(order).toEqual(['combat']);
    expect(isSceneTransitionInProgress()).toBe(false);
  });

  it('drops deferred combat when scene changed before flush', () => {
    const executor = vi.fn();
    registerCombatStartExecutor(executor);

    deferCombatStartIfTransitionBusy('system_daemon');
    flushDeferredCombatStart();

    expect(executor).not.toHaveBeenCalled();
  });
});
