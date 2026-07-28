import { beforeEach, describe, expect, it, vi } from 'vitest';

const getGameSnapshot = vi.fn();
const dispatchGameAction = vi.fn();

vi.mock('@/engine/GameActionDispatcher', () => ({
  getGameSnapshot: (...args: unknown[]) => getGameSnapshot(...args),
  dispatchGameAction: (...args: unknown[]) => dispatchGameAction(...args),
}));

import {
  addXp,
  buildVictorySkillXp,
  calculateXpToNextLevel,
  computeCombatCredits,
  computeDefeatPenalties,
  computeFleeChance,
  computeVictoryComboBonus,
  computeVictoryLootChance,
  getComboMultiplier,
  getCritChance,
  getPlayerAttack,
  getPlayerDefense,
  getPlayerMaxHp,
  isPowerAvailable,
  spiritualDamageReduction,
  tickPowerCooldowns,
} from './formulas';
import type { CombatState } from './types';

function playerSnap(overrides: {
  coding?: number;
  logic?: number;
  empathy?: number;
  energy?: number;
  poems?: string[];
} = {}) {
  return {
    playerState: {
      skills: {
        coding: overrides.coding ?? 5,
        logic: overrides.logic ?? 3,
        empathy: overrides.empathy ?? 4,
      },
      energy: overrides.energy ?? 20,
    },
    collectedPoems: overrides.poems ?? [],
  };
}

describe('getPlayerAttack / getPlayerDefense / getPlayerMaxHp', () => {
  beforeEach(() => {
    getGameSnapshot.mockReset();
    dispatchGameAction.mockReset();
  });

  it('sums coding + logic for attack', () => {
    getGameSnapshot.mockReturnValue(playerSnap({ coding: 7, logic: 4 }));
    expect(getPlayerAttack()).toBe(11);
  });

  it('uses empathy + floor(energy/10) for defense', () => {
    getGameSnapshot.mockReturnValue(playerSnap({ empathy: 6, energy: 25 }));
    expect(getPlayerDefense()).toBe(8);
  });

  it('clamps max HP to at least 20', () => {
    getGameSnapshot.mockReturnValue(playerSnap({ energy: 5 }));
    expect(getPlayerMaxHp()).toBe(20);
    getGameSnapshot.mockReturnValue(playerSnap({ energy: 30 }));
    expect(getPlayerMaxHp()).toBe(60);
  });
});

describe('computeCombatCredits', () => {
  it('scales with xp and combo, with a floor of 8', () => {
    expect(computeCombatCredits(10, 0)).toBe(8);
    expect(computeCombatCredits(40, 3)).toBe(26);
  });
});

describe('tickPowerCooldowns', () => {
  it('decrements and drops expired entries', () => {
    expect(tickPowerCooldowns({ poem_1: 2, poem_2: 1 })).toEqual({ poem_1: 1 });
  });
});

describe('isPowerAvailable', () => {
  beforeEach(() => {
    getGameSnapshot.mockReset();
  });

  it('requires collected poem and zero cooldown', () => {
    getGameSnapshot.mockReturnValue(playerSnap({ poems: ['poem_1'] }));
    const ready = { powerCooldowns: { poem_1: 0 } } as unknown as CombatState;
    const cooling = { powerCooldowns: { poem_1: 2 } } as unknown as CombatState;
    expect(isPowerAvailable('poem_1', ready)).toBe(true);
    expect(isPowerAvailable('poem_2', ready)).toBe(false);
    expect(isPowerAvailable('poem_1', cooling)).toBe(false);
  });
});

describe('calculateXpToNextLevel / addXp', () => {
  beforeEach(() => {
    dispatchGameAction.mockReset();
  });

  it('grows xp curve with level', () => {
    expect(calculateXpToNextLevel(1)).toBe(100);
    expect(calculateXpToNextLevel(2)).toBe(125);
    expect(calculateXpToNextLevel(3)).toBeGreaterThan(calculateXpToNextLevel(2));
  });

  it('dispatches player/addXp', () => {
    addXp(42);
    expect(dispatchGameAction).toHaveBeenCalledWith({ type: 'player/addXp', amount: 42 });
  });
});

describe('getComboMultiplier / getCritChance', () => {
  it('steps combo multipliers at 1 / 2 / 3 hits', () => {
    expect(getComboMultiplier(0)).toBe(1);
    expect(getComboMultiplier(1)).toBe(1.2);
    expect(getComboMultiplier(2)).toBe(1.5);
    expect(getComboMultiplier(3)).toBe(2);
    expect(getComboMultiplier(9)).toBe(2);
  });

  it('caps crit chance at 50%', () => {
    expect(getCritChance(0)).toBe(0.1);
    expect(getCritChance(5)).toBe(0.2);
    expect(getCritChance(30)).toBe(0.5);
  });
});

describe('computeFleeChance', () => {
  it('applies attempt / skill / karma bonuses and clamps', () => {
    expect(
      computeFleeChance({
        playerSpeed: 0,
        enemySpeed: 0,
        fleeAttempts: 0,
        unlockedSkills: [],
        karma: 0,
      }),
    ).toBe(0.35);

    expect(
      computeFleeChance({
        playerSpeed: 10,
        enemySpeed: 0,
        fleeAttempts: 2,
        unlockedSkills: ['tech_4a', 'social_2a'],
        karma: 70,
      }),
    ).toBe(0.95);

    expect(
      computeFleeChance({
        playerSpeed: 0,
        enemySpeed: 100,
        fleeAttempts: 0,
        unlockedSkills: [],
        karma: 0,
      }),
    ).toBe(0.15);
  });
});

describe('victory / defeat helpers', () => {
  it('caps combo bonus and loot chance', () => {
    expect(computeVictoryComboBonus(3)).toBe(6);
    expect(computeVictoryComboBonus(20)).toBe(10);
    expect(computeVictoryLootChance(0)).toBe(0.6);
    expect(computeVictoryLootChance(10)).toBe(0.9);
  });

  it('splits skill XP from combat XP', () => {
    expect(buildVictorySkillXp(100)).toEqual({ coding: 30, logic: 20, writing: 10 });
  });

  it('rolls defeat penalties in historical ranges', () => {
    const low = computeDefeatPenalties(() => 0);
    expect(low).toEqual({ energyLost: 15, karmaLost: 5 });
    const high = computeDefeatPenalties(() => 0.999);
    expect(high.energyLost).toBe(24);
    expect(high.karmaLost).toBe(9);
  });

  it('counts spiritual_* skills for damage reduction', () => {
    expect(spiritualDamageReduction([])).toBe(0);
    expect(spiritualDamageReduction(['spiritual_1a', 'tech_1a', 'spiritual_2b'])).toBe(0.1);
  });
});
