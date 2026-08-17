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
      coding: 10,
      logic: 10,
      empathy: 10,
      writing: 10,
      intuition: 10,
    },
    progression: {
      level: 1,
      currentAct: 1,
      unlockedSkills: [] as string[],
      unlockedPerks: [] as string[],
    },
    stress: 0,
    flags: {} as Record<string, boolean>,
  },
  exploration: { timeOfDay: 'day' as const },
  activeTTLFlags: [] as string[],
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

function mockLocalStorage() {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
    removeItem(key: string) {
      store.delete(key);
    },
    key() {
      return null;
    },
  } as Storage;
}

function advanceEnemyTurn() {
  vi.advanceTimersByTime(800);
}

function runEnemyTurnAfterPlayerAction() {
  const state = getCombatState();
  if (!state || state.status !== 'active' || state.isPlayerTurn) return;
  advanceEnemyTurn();
}

describe('combat flow integration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('localStorage', mockLocalStorage());
    dispatchGameAction.mockClear();
    disposeCombatSystem();
  });

  afterEach(() => {
    disposeCombatSystem();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('attack loop reaches victory against a low-level encounter', () => {
    startCombat('system_daemon', { skipPresentation: true });
    setCombatRngStateForTests(createCombatRngState(0xabc));

    let safety = 0;
    while (getCombatState()?.status === 'active' && safety < 20) {
      const state = getCombatState()!;
      if (state.isPlayerTurn) {
        playerAttack();
      } else {
        advanceEnemyTurn();
      }
      safety += 1;
    }

    expect(getCombatState()?.status).toBe('victory');
    expect(safety).toBeLessThan(20);
  });

  it('playerDefend reduces incoming enemy damage on the next hit', () => {
    const rngSeed = createCombatRngState(0x5151);

    startCombat('corporate_golem', { skipPresentation: true });
    setCombatRngStateForTests(rngSeed);
    const hpBeforeDefend = getCombatState()!.playerHp;

    playerDefend();
    runEnemyTurnAfterPlayerAction();
    const hpAfterDefend = getCombatState()!.playerHp;
    const defendedLoss = hpBeforeDefend - hpAfterDefend;

    disposeCombatSystem();

    startCombat('corporate_golem', { skipPresentation: true });
    setCombatRngStateForTests(rngSeed);
    const hpBeforeOpen = getCombatState()!.playerHp;

    playerAttack();
    runEnemyTurnAfterPlayerAction();
    const hpAfterOpen = getCombatState()!.playerHp;
    const openLoss = hpBeforeOpen - hpAfterOpen;

    expect(defendedLoss).toBeGreaterThanOrEqual(0);
    expect(openLoss).toBeGreaterThan(0);
    expect(defendedLoss).toBeLessThan(openLoss);
  });

  it('playerFlee succeeds and emits combat:fled', () => {
    const fled = vi.fn();
    eventBus.on('combat:fled', fled);

    startCombat('corporate_golem', { skipPresentation: true });
    setCombatRngStateForTests(createCombatRngState(1));

    const result = playerFlee();

    expect(result?.status).toBe('fled');
    expect(fled).toHaveBeenCalledWith({ enemyType: 'corporate_golem' });
  });
});
