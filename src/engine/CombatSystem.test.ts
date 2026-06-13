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
  startCombat,
} from '@/engine/CombatSystem';

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

    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);

    startCombat('system_daemon');
    playerAttack();
    expect(getCombatState()?.status).toBe('victory');

    startCombat('system_daemon');
    expect(getCombatState()?.status).toBe('active');

    vi.advanceTimersByTime(3000);

    expect(getCombatState()?.status).toBe('active');
    expect(combatEnd).not.toHaveBeenCalled();

    randomSpy.mockRestore();
  });
});
