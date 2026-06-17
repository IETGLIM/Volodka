import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { eventBus } from '@/engine/EventBus';

const dispatchGameAction = vi.fn();

const mockSnapshot = {
  showStoryOverlay: false,
  currentNodeId: null as string | null,
  collectedPoems: [] as string[],
  playerState: {
    energy: 100,
    karma: 50,
    rngSeed: 0x1234,
    combatEncounterSeq: 0,
    skills: {
      coding: 50,
      logic: 50,
      empathy: 10,
      writing: 10,
      intuition: 10,
    },
    progression: {
      level: 5,
      currentAct: 2,
      unlockedSkills: [] as string[],
    },
  },
};

vi.mock('@/engine/GameActionDispatcher', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/engine/GameActionDispatcher')>();
  return {
    ...actual,
    getGameSnapshot: () => mockSnapshot,
    dispatchGameAction: (...args: unknown[]) => dispatchGameAction(...args),
    tryActivatePoemPower: vi.fn(),
    tryAddInventoryItem: vi.fn(() => true),
  };
});

vi.mock('@/data/items', () => ({
  createInventoryItem: (id: string) => ({ id }),
}));

vi.mock('@/shared/dev/hmrDispose', () => ({
  registerHmrDispose: vi.fn(),
}));

import {
  disposeCombatSystem,
  getCombatState,
  playerAttack,
  playerDefend,
  playerFlee,
  setCombatRngStateForTests,
  startCombat,
} from '@/engine/CombatSystem';
import { createCombatRngState } from '@/engine/combat/combatRng';

describe('CombatSystem session timers', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    dispatchGameAction.mockClear();
    disposeCombatSystem();
  });

  afterEach(() => {
    disposeCombatSystem();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('beginSession clears a stale victory exit timer so a new fight is not ended early', () => {
    const combatEnd = vi.fn();
    eventBus.on('combat:end', combatEnd);

    dispatchGameAction.mockImplementation((action: { type: string; seed?: number }) => {
      if (action.type === 'player/setRngSeed' && action.seed != null) {
        mockSnapshot.playerState.rngSeed = action.seed;
      }
      if (action.type === 'player/bumpCombatEncounterSeq') {
        mockSnapshot.playerState.combatEncounterSeq += 1;
      }
    });

    dispatchGameAction({ type: 'player/setRngSeed', seed: 0x1234 });

    startCombat('system_daemon', { skipPresentation: true });
    setCombatRngStateForTests(createCombatRngState(0));
    playerAttack();
    expect(getCombatState()?.status).toBe('victory');

    startCombat('system_daemon', { skipPresentation: true });
    expect(getCombatState()?.status).toBe('active');

    vi.advanceTimersByTime(3000);

    expect(getCombatState()?.status).toBe('active');
    expect(combatEnd).not.toHaveBeenCalled();
  });
});

describe('CombatSystem core flows', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    dispatchGameAction.mockClear();
    disposeCombatSystem();
  });

  afterEach(() => {
    disposeCombatSystem();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('startCombat opens an active player turn', () => {
    startCombat('system_daemon', { skipPresentation: true });
    const state = getCombatState();
    expect(state?.status).toBe('active');
    expect(state?.isPlayerTurn).toBe(true);
    expect(state?.enemy.type).toBe('system_daemon');
  });

  it('playerDefend ends the player turn without forcing victory', () => {
    startCombat('system_daemon', { skipPresentation: true });
    const defended = playerDefend();
    expect(defended?.status).toBe('active');
    expect(defended?.isPlayerTurn).toBe(false);
  });

  it('playerFlee can succeed and emit combat:fled', () => {
    const fled = vi.fn();
    eventBus.on('combat:fled', fled);

    startCombat('system_daemon', { skipPresentation: true });
    setCombatRngStateForTests(createCombatRngState(1));
    const result = playerFlee();

    expect(result?.status).toBe('fled');
    expect(fled).toHaveBeenCalledWith({ enemyType: 'system_daemon' });
  });
});
