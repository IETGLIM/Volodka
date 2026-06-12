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
} from './SceneTransitionManager';
import { resetGlobalCleanupRegistry } from './GlobalCleanupService';

const dispatchGameAction = vi.fn();

vi.mock('@/engine/GameActionDispatcher', () => ({
  getGameSnapshot: () => ({
    exploration: { currentSceneId: 'volodka_room' },
    showStoryOverlay: false,
  }),
  dispatchGameAction: (...args: unknown[]) => dispatchGameAction(...args),
}));

describe('combatStartGate', () => {
  beforeEach(() => {
    resetCombatStartGate();
    resetSceneTransitionGuard();
    resetGlobalCleanupRegistry();
    dispatchGameAction.mockClear();
  });

  it('defers combat during performSceneTransition and flushes after scene:loaded', () => {
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

    expect(order).toEqual(['enter', 'loaded', 'combat']);
    expect(executor).toHaveBeenCalledTimes(1);
    expect(executor).toHaveBeenCalledWith('system_daemon', undefined);
  });

  it('drops deferred combat when scene changed before flush', () => {
    const executor = vi.fn();
    registerCombatStartExecutor(executor);

    deferCombatStartIfTransitionBusy('system_daemon');
    flushDeferredCombatStart();

    expect(executor).not.toHaveBeenCalled();
  });
});
