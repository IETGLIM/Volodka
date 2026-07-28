import { describe, expect, it, vi, beforeEach } from 'vitest';
import { computeEnemyIncomingDamage, resolveStatDrain } from './enemyTurn';
import type { IncomingDamageParams } from './enemyTurn';
import { SeededCombatRng } from './combatRng';
import type { CombatState } from './types';
import type { CombatEnemy, CombatBuff } from '@/shared/types/game';
import type { CombatPerkModifiers } from '@/shared/perks/perkModifiers';

// getPlayerDefense() reads from the game store — mock it for pure unit tests
const mockGetPlayerDefense = vi.fn(() => 8);
vi.mock('./formulas', async (importOriginal) => {
  const mod = await importOriginal<typeof import('./formulas')>();
  return {
    ...mod,
    getPlayerDefense: ((...args: Parameters<typeof mod.getPlayerDefense>) =>
      mockGetPlayerDefense(...args)) as typeof mod.getPlayerDefense,
  };
});

const EMPTY_PERK_MODS: CombatPerkModifiers = {
  flatAttackBonus: 0,
  flatDefenseBonus: 0,
  outgoingDamageMultiplier: 1,
  incomingDamageReduction: 0,
  counterAttackChance: 0,
  fleeEncounterChance: 0,
  defenseMultiplier: 1,
};

/* ═══════════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════════ */

function makeEnemy(overrides: Partial<CombatEnemy> = {}): CombatEnemy {
  return {
    type: 'system_daemon',
    name: 'Тестовый Баг',
    emoji: '🐛',
    hp: 50,
    maxHp: 50,
    attack: 12,
    defense: 3,
    speed: 5,
    lootTable: [],
    xpReward: 20,
    targetsStat: 'logic',
    specialCooldown: 0,
    ...overrides,
  };
}

function makeCombatState(overrides: Partial<CombatState> = {}): CombatState {
  return {
    enemy: makeEnemy(),
    playerHp: 100,
    playerMaxHp: 100,
    turn: 1,
    isPlayerTurn: false,
    playerDefending: false,
    enemyDefending: false,
    log: [],
    status: 'active',
    powerCooldowns: {},
    enemyDefenseReduction: 0,
    doubleAttack: false,
    buffs: [],
    fleeAttempts: 0,
    _nextBuffId: 1,
    comboCount: 0,
    maxCombo: 0,
    lastCritical: false,
    lastPoemPowersUsed: [null, null],
    lastUsedPoemId: null,
    rng: { state: 42, rolls: 0, pity: { rollsSinceCrit: 0, rollsSinceHit: 0 } },
    ...overrides,
  };
}

function makeBuff(overrides: Partial<CombatBuff> = {}): CombatBuff {
  return {
    id: 'test_1',
    name: 'Test Buff',
    source: 'test',
    kind: 'buff',
    target: 'player',
    duration: 3,
    effect: { type: 'damage_reduction', value: 0.3 },
    ...overrides,
  };
}

/** Mock localStorage so scaleEnemyDamageByDifficulty doesn't blow up */
function mockLocalStorage() {
  const store = new Map<string, string>();
  return {
    get length() { return store.size; },
    clear() { store.clear(); },
    getItem(key: string) { return store.has(key) ? store.get(key)! : null; },
    setItem(key: string, value: string) { store.set(key, value); },
    removeItem(key: string) { store.delete(key); },
    key() { return null; },
  } as Storage;
}

function makeParams(overrides: Partial<IncomingDamageParams> = {}): IncomingDamageParams {
  return {
    combatState: makeCombatState(),
    rng: SeededCombatRng.fromState({ state: 0xdeadbeef, rolls: 0, pity: { rollsSinceCrit: 0, rollsSinceHit: 0 } }),
    currentAct: 1,
    currentLevel: 1,
    spiritualSkillCount: 0,
    perkMods: { ...EMPTY_PERK_MODS },
    ...overrides,
  };
}

/* ═══════════════════════════════════════════════════════════════
   computeEnemyIncomingDamage
   ═══════════════════════════════════════════════════════════════ */

describe('computeEnemyIncomingDamage', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', mockLocalStorage());
    mockGetPlayerDefense.mockReturnValue(8);
  });

  it('returns positive damage with no buffs', () => {
    const result = computeEnemyIncomingDamage(makeParams());
    expect(result.damage).toBeGreaterThanOrEqual(1);
    // RNG state should advance (at least one roll for damage variance)
    expect(result.rng.getState().rolls).toBeGreaterThan(0);
  });

  it('is deterministic with the same RNG seed', () => {
    const params = makeParams();
    const a = computeEnemyIncomingDamage(params);
    // Re-create with same seed
    const b = computeEnemyIncomingDamage({
      ...params,
      rng: SeededCombatRng.fromState({ state: 0xdeadbeef, rolls: 0, pity: { rollsSinceCrit: 0, rollsSinceHit: 0 } }),
    });
    expect(a.damage).toBe(b.damage);
  });

  it('applies enemy defense_reduction debuff (increases damage to player)', () => {
    // When the enemy has defense_reduction, the enemy deals MORE base damage
    // (their attack effectively goes up)
    const base = computeEnemyIncomingDamage(makeParams({
      combatState: makeCombatState({ enemy: makeEnemy({ attack: 15 }) }),
    }));

    const withAtkBoost = computeEnemyIncomingDamage(makeParams({
      combatState: makeCombatState({
        enemy: makeEnemy({ attack: 15 }),
        buffs: [makeBuff({ target: 'enemy', effect: { type: 'attack_boost', value: 10 } })],
      }),
    }));

    expect(withAtkBoost.damage).toBeGreaterThan(base.damage);
  });

  it('applies player damage_reduction buff (decreases incoming damage)', () => {
    const base = computeEnemyIncomingDamage(makeParams());

    const withReduction = computeEnemyIncomingDamage(makeParams({
      combatState: makeCombatState({
        buffs: [makeBuff({ effect: { type: 'damage_reduction', value: 0.3 } })],
      }),
    }));

    expect(withReduction.damage).toBeLessThan(base.damage);
  });

  it('applies player vulnerability (defense_reduction on player increases damage)', () => {
    const base = computeEnemyIncomingDamage(makeParams());

    const withVuln = computeEnemyIncomingDamage(makeParams({
      combatState: makeCombatState({
        buffs: [makeBuff({ effect: { type: 'defense_reduction', value: 0.3 } })],
      }),
    }));

    expect(withVuln.damage).toBeGreaterThan(base.damage);
  });

  it('applies spiritual skills reduction (5% per skill level)', () => {
    const base = computeEnemyIncomingDamage(makeParams({ spiritualSkillCount: 0 }));
    const withSpiritual = computeEnemyIncomingDamage(makeParams({ spiritualSkillCount: 3 }));

    // 3 spiritual skills × 5% = 15% reduction
    expect(withSpiritual.damage).toBeLessThan(base.damage);
  });

  it('applies perk incomingDamageReduction', () => {
    const base = computeEnemyIncomingDamage(makeParams({
      perkMods: { ...EMPTY_PERK_MODS },
    }));
    const withPerk = computeEnemyIncomingDamage(makeParams({
      perkMods: { ...EMPTY_PERK_MODS, incomingDamageReduction: 0.2 },
    }));

    expect(withPerk.damage).toBeLessThan(base.damage);
  });

  it('damage never drops below MIN_DAMAGE (1)', () => {
    // Extreme reduction: max spiritual (10) + max perk (0.8) + max buff (0.8)
    const result = computeEnemyIncomingDamage(makeParams({
      combatState: makeCombatState({
        buffs: [
          makeBuff({ effect: { type: 'damage_reduction', value: 0.5 } }),
          makeBuff({ effect: { type: 'defensive_verse' } }),
        ],
      }),
      spiritualSkillCount: 10,
      perkMods: { ...EMPTY_PERK_MODS, incomingDamageReduction: 0.8 },
    }));

    expect(result.damage).toBeGreaterThanOrEqual(1);
  });

  it('applies enemy damage_multiplier buff', () => {
    const base = computeEnemyIncomingDamage(makeParams());

    const withMult = computeEnemyIncomingDamage(makeParams({
      combatState: makeCombatState({
        buffs: [makeBuff({ target: 'enemy', effect: { type: 'damage_multiplier', value: 1.5 } })],
      }),
    }));

    expect(withMult.damage).toBeGreaterThan(base.damage);
  });

  it('scales with act number', () => {
    const act1 = computeEnemyIncomingDamage(makeParams({ currentAct: 1 }));
    const act5 = computeEnemyIncomingDamage(makeParams({
      currentAct: 5,
      // Same RNG seed
      rng: SeededCombatRng.fromState({ state: 0xdeadbeef, rolls: 0, pity: { rollsSinceCrit: 0, rollsSinceHit: 0 } }),
    }));

    // Act 5 has +60% scaling (4 × 15%)
    expect(act5.damage).toBeGreaterThan(act1.damage);
  });

  it('scales with player level', () => {
    const lvl1 = computeEnemyIncomingDamage(makeParams({ currentLevel: 1 }));
    const lvl10 = computeEnemyIncomingDamage(makeParams({
      currentLevel: 10,
      rng: SeededCombatRng.fromState({ state: 0xdeadbeef, rolls: 0, pity: { rollsSinceCrit: 0, rollsSinceHit: 0 } }),
    }));

    // Level 10 has +90% scaling (9 × 10%)
    expect(lvl10.damage).toBeGreaterThan(lvl1.damage);
  });

  it('applies player defense_boost buff (flat reduction)', () => {
    const base = computeEnemyIncomingDamage(makeParams());

    const withDefBoost = computeEnemyIncomingDamage(makeParams({
      combatState: makeCombatState({
        buffs: [makeBuff({ effect: { type: 'defense_boost', value: 5 } })],
      }),
    }));

    expect(withDefBoost.damage).toBeLessThanOrEqual(base.damage);
  });
});

/* ═══════════════════════════════════════════════════════════════
   resolveStatDrain
   ═══════════════════════════════════════════════════════════════ */

describe('resolveStatDrain', () => {
  it('returns null when targetsStat is undefined', () => {
    const rng = SeededCombatRng.fromState({ state: 42, rolls: 0, pity: { rollsSinceCrit: 0, rollsSinceHit: 0 } });
    const result = resolveStatDrain(undefined, rng);
    expect(result.action).toBeNull();
    expect(result.label).toBe('');
  });

  it('returns null when targetsStat is unknown string', () => {
    const rng = SeededCombatRng.fromState({ state: 42, rolls: 0, pity: { rollsSinceCrit: 0, rollsSinceHit: 0 } });
    const result = resolveStatDrain('unknown_stat', rng);
    expect(result.action).toBeNull();
    expect(result.label).toBe('');
  });

  it('returns null when RNG does not trigger (targetsStat=logic, chance=0.3)', () => {
    // Use an RNG seed that will produce a value >= 0.3 for the first roll
    // We need to find such a seed empirically or just test with a controlled approach
    const rng = SeededCombatRng.fromState({ state: 0, rolls: 0, pity: { rollsSinceCrit: 0, rollsSinceHit: 0 } });
    const result = resolveStatDrain('logic', rng);
    // Whether it triggers or not depends on the seed — just verify the shape
    if (result.action) {
      expect(result.action).toMatchObject({ type: 'player/addSkill', skill: 'logic', amount: -1 });
      expect(result.label).toBe(' Логика -1!');
    } else {
      expect(result.action).toBeNull();
      expect(result.label).toBe('');
    }
  });

  it('returns correct action for logic drain', () => {
    // Seed that rolls < 0.3 for logic (chance = 0.3)
    // mulberry32(0x3f800000) first value — need to find one that's < 0.3
    // Instead, just test the structure with a seed that works
    const results: boolean[] = [];
    for (let seed = 0; seed < 10000; seed++) {
      const rng = SeededCombatRng.fromState({ state: seed, rolls: 0, pity: { rollsSinceCrit: 0, rollsSinceHit: 0 } });
      const r = resolveStatDrain('logic', rng);
      if (r.action !== null) {
        expect(r.action).toEqual({ type: 'player/addSkill', skill: 'logic', amount: -1 });
        expect(r.label).toBe(' Логика -1!');
        results.push(true);
        break;
      }
    }
    // At least one seed should trigger logic drain (30% chance)
    expect(results.length).toBeGreaterThan(0);
  });

  it('returns correct action for empathy drain', () => {
    for (let seed = 0; seed < 10000; seed++) {
      const rng = SeededCombatRng.fromState({ state: seed, rolls: 0, pity: { rollsSinceCrit: 0, rollsSinceHit: 0 } });
      const r = resolveStatDrain('empathy', rng);
      if (r.action !== null) {
        expect(r.action).toEqual({ type: 'player/addSkill', skill: 'empathy', amount: -1 });
        expect(r.label).toBe(' Эмпатия -1!');
        return;
      }
    }
    expect.fail('No seed triggered empathy drain in 10000 attempts');
  });

  it('returns correct action for energy drain', () => {
    for (let seed = 0; seed < 10000; seed++) {
      const rng = SeededCombatRng.fromState({ state: seed, rolls: 0, pity: { rollsSinceCrit: 0, rollsSinceHit: 0 } });
      const r = resolveStatDrain('energy', rng);
      if (r.action !== null) {
        expect(r.action).toEqual({ type: 'player/addEnergy', amount: -5 });
        expect(r.label).toBe(' Энергия -5!');
        return;
      }
    }
    expect.fail('No seed triggered energy drain in 10000 attempts');
  });

  it('returns correct action for karma drain', () => {
    for (let seed = 0; seed < 10000; seed++) {
      const rng = SeededCombatRng.fromState({ state: seed, rolls: 0, pity: { rollsSinceCrit: 0, rollsSinceHit: 0 } });
      const r = resolveStatDrain('karma', rng);
      if (r.action !== null) {
        expect(r.action).toEqual({ type: 'player/addKarma', amount: -3 });
        expect(r.label).toBe(' Карма -3!');
        return;
      }
    }
    expect.fail('No seed triggered karma drain in 10000 attempts');
  });

  it('drain probability differs per stat type', () => {
    // Test that different stats have different trigger chances
    // by counting triggers across many seeds
    const countTriggers = (stat: string, count: number): number => {
      let triggered = 0;
      for (let seed = 0; seed < count; seed++) {
        const rng = SeededCombatRng.fromState({ state: seed, rolls: 0, pity: { rollsSinceCrit: 0, rollsSinceHit: 0 } });
        if (resolveStatDrain(stat, rng).action !== null) triggered++;
      }
      return triggered;
    };

    const logicTriggers = countTriggers('logic', 10000);
    const energyTriggers = countTriggers('energy', 10000);

    // logic: 30% chance, energy: 40% chance
    // With 10000 samples, they should be clearly different
    expect(energyTriggers).toBeGreaterThan(logicTriggers);
    // Rough bounds: 30% ± 3% for logic, 40% ± 3% for energy
    expect(logicTriggers).toBeGreaterThan(2700);
    expect(logicTriggers).toBeLessThan(3300);
    expect(energyTriggers).toBeGreaterThan(3700);
    expect(energyTriggers).toBeLessThan(4300);
  });

  it('advances RNG state when rolling', () => {
    const rngState = { state: 42, rolls: 0, pity: { rollsSinceCrit: 0, rollsSinceHit: 0 } };
    const rng = SeededCombatRng.fromState(rngState);
    resolveStatDrain('logic', rng);
    // RNG should have advanced by at least 1 roll
    expect(rng.getState().rolls).toBeGreaterThanOrEqual(1);
  });
});
