import { beforeEach, describe, expect, it } from 'vitest';
import { disposeEventBus, eventBus, reviveEventBus } from '@/engine/EventBus';
import {
  activatePoemPowerById,
  bindPoemResetListener,
  clearAllPowerTimers,
  getActiveEffects,
} from '@/engine/PoemPowerSystem';
import { useGameStore } from '@/store/gameStore';

describe('bindPoemResetListener', () => {
  beforeEach(() => {
    clearAllPowerTimers();
    reviveEventBus();
    bindPoemResetListener();
  });

  it('clears activeEffects after EventBus dispose and re-bind', () => {
    useGameStore.setState({ collectedPoems: ['poem_1'] });
    expect(activatePoemPowerById('poem_1')).toBe(true);
    expect(getActiveEffects().length).toBeGreaterThan(0);

    disposeEventBus();
    eventBus.emit('poem:reset_all_effects', {});
    expect(getActiveEffects().length).toBeGreaterThan(0);

    reviveEventBus();
    bindPoemResetListener();
    eventBus.emit('poem:reset_all_effects', {});
    expect(getActiveEffects()).toHaveLength(0);
  });
});
