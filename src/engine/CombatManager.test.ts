import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { dispatchGameAction, getGameSnapshot } = vi.hoisted(() => ({
  dispatchGameAction: vi.fn(),
  getGameSnapshot: vi.fn(),
}));

vi.mock('@/engine/GameActionDispatcher', () => ({
  dispatchGameAction,
  getGameSnapshot,
  tryActivatePoemPower: vi.fn(),
  tryAddInventoryItem: vi.fn(),
}));

vi.mock('@/data/items', () => ({
  createInventoryItem: vi.fn(() => null),
}));

import {
  disposeCombatSystem,
  getCombatState,
  playerAttack,
  playerFlee,
  startCombat,
} from '@/engine/CombatSystem';

function mockSnapshot(overrides: Record<string, unknown> = {}) {
  return {
    currentNodeId: 'start',
    showStoryOverlay: false,
    playerState: {
      progression: { level: 1, unlockedSkills: [] },
      skills: {
        logic: 5,
        coding: 5,
        empathy: 5,
        persuasion: 5,
        intuition: 8,
        writing: 5,
        rhythm: 5,
      },
      karma: 50,
    },
    ...overrides,
  };
}

describe('CombatManager lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    getGameSnapshot.mockReturnValue(mockSnapshot());
    disposeCombatSystem();
  });

  afterEach(() => {
    disposeCombatSystem();
    expect(getCombatState()).toBeNull();
    vi.useRealTimers();
  });

  it('rapid start/end does not leave active combat state', () => {
    startCombat('system_daemon');
    expect(getCombatState()?.status).toBe('active');

    disposeCombatSystem();
    expect(getCombatState()).toBeNull();

    startCombat('corporate_golem');
    expect(getCombatState()?.status).toBe('active');
    disposeCombatSystem();
    expect(getCombatState()).toBeNull();
  });

  it('flee spam clears combat after successful flee', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);

    startCombat('system_daemon');
    expect(getCombatState()?.status).toBe('active');

    playerFlee();
    expect(getCombatState()?.status).toBe('fled');

    vi.advanceTimersByTime(2000);
    expect(getCombatState()).toBeNull();
    expect(dispatchGameAction).toHaveBeenCalledWith({ type: 'story/setCombatActive', active: false });
  });

  it('starting new combat while active discards orphaned return stack entry', () => {
    getGameSnapshot.mockReturnValue(
      mockSnapshot({ currentNodeId: 'room_table', showStoryOverlay: true }),
    );

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    startCombat('system_daemon');
    startCombat('shadow_agent');

    expect(getCombatState()?.status).toBe('active');
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Discarded orphaned return node'),
    );

    warnSpy.mockRestore();
  });

  it('dispose during enemy turn clears scheduled callbacks', () => {
    startCombat('system_daemon');
    playerAttack();
    expect(getCombatState()?.isPlayerTurn).toBe(false);

    disposeCombatSystem();
    vi.advanceTimersByTime(3000);
    expect(getCombatState()).toBeNull();
  });

  it('caps returnStack at MAX_RETURN_STACK_DEPTH', () => {
    getGameSnapshot.mockReturnValue(
      mockSnapshot({ currentNodeId: 'room_table', showStoryOverlay: true }),
    );

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    for (let i = 0; i < 10; i++) {
      startCombat('system_daemon');
    }

    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
