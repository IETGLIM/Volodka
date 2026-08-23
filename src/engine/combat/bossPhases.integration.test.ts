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
  difficultySettings: {
    difficulty: 'normal' as const,
    enemyDamageMultiplier: 1.0,
    enemyHealthMultiplier: 1.0,
    playerDamageMultiplier: 1.0,
    xpMultiplier: 1.0,
    creditsMultiplier: 1.0,
    skillCheckThreshold: 0,
    stressAccumulationRate: 1.0,
    energyRegenRate: 1.0,
    combatFleeBaseChance: 0.3,
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
  setCombatStateForTests,
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
  vi.advanceTimersByTime(1000);
}

describe('boss phase transitions (integration)', () => {
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

  it('crossing 60% HP transitions the keeper into phase 2 with i-frames and adds', () => {
    const bossPhaseEvent = vi.fn();
    eventBus.on('combat:boss_phase', bossPhaseEvent);

    startCombat('boss_catacombs_keeper', { skipPresentation: true });
    setCombatRngStateForTests(createCombatRngState(0x1234));

    const state = getCombatState()!;
    expect(state.bossPhase).toBe(0);

    // Preset the boss to 1 HP above the 60% boundary (phase 2 = ≤60%).
    // NOTE: the player's base attack is weak vs this boss (affinity ×0.1 on
    // the physical channel → ~3 dmg), so the preset must sit exactly at the
    // threshold for ANY damage ≥1 to cross it.
    const hpAboveThreshold = Math.floor(state.enemy.maxHp * 0.6) + 1;
    setCombatStateForTests({
      ...state,
      enemy: { ...state.enemy, hp: hpAboveThreshold },
      isPlayerTurn: true,
    });

    const baseSpeed = getCombatState()!.enemy.speed;
    playerAttack();

    const after = getCombatState()!;
    // Any damage ≥1 crosses (60%+1) → ≤60%: phase 2 entered.
    expect(after.bossPhase).toBe(1);
    expect(after.enemy.hp).toBeLessThanOrEqual(Math.floor(after.enemy.maxHp * 0.6));
    // Speed multiplier ×1.2 applied from the un-multiplied base
    expect(after.enemy.speed).toBeGreaterThan(baseSpeed);
    expect(after.bossBaseSpeed).toBe(baseSpeed);

    // I-frames buff on the enemy (damage_reduction 1.0 → one hit absorbed)
    const iframeBuff = after.buffs.find((b) => b.name === 'Фазовый переход');
    expect(iframeBuff).toBeDefined();
    expect(iframeBuff!.effect).toEqual({ type: 'damage_reduction', value: 1 });

    // Adds (strictly-1v1 substitute): shadow reinforcement attack buff
    const shadesBuff = after.buffs.find((b) => b.name === 'Тени');
    expect(shadesBuff).toBeDefined();
    expect(shadesBuff!.effect).toEqual({ type: 'attack_boost', value: 6 });

    // Combat log announces the phase in Russian
    expect(after.log.some((l) => l.text.includes('Фаза 2'))).toBe(true);

    // Typed event for UI/audio layers
    expect(bossPhaseEvent).toHaveBeenCalledWith(
      expect.objectContaining({ enemyType: 'boss_catacombs_keeper', phase: 1 }),
    );

    eventBus.off('combat:boss_phase', bossPhaseEvent);
  });

  it('i-frames absorb the player’s next attack entirely', () => {
    startCombat('boss_catacombs_keeper', { skipPresentation: true });
    setCombatRngStateForTests(createCombatRngState(0x1234));

    const state = getCombatState()!;
    const hpAboveThreshold = Math.floor(state.enemy.maxHp * 0.6) + 1;
    setCombatStateForTests({
      ...state,
      enemy: { ...state.enemy, hp: hpAboveThreshold },
      isPlayerTurn: true,
    });

    playerAttack(); // crosses 60% → phase 2 + i-frames
    advanceEnemyTurn(); // enemy turn ticks the iframe buff 2 → 1 (still active)

    const beforeAbsorb = getCombatState()!;
    expect(beforeAbsorb.buffs.some((b) => b.name === 'Фазовый переход')).toBe(true);

    playerAttack(); // absorbed by i-frames

    const absorbed = getCombatState()!;
    expect(absorbed.enemy.hp).toBe(beforeAbsorb.enemy.hp);
    expect(absorbed.log.some((l) => l.text.includes('поглощён'))).toBe(true);
    // The iframe buff is consumed by the absorbed hit (removed on the next
    // enemy turn tick) — the hit itself registered zero damage.
  });

  it('non-boss enemies never transition phases', () => {
    const bossPhaseEvent = vi.fn();
    eventBus.on('combat:boss_phase', bossPhaseEvent);

    startCombat('system_daemon', { skipPresentation: true });
    setCombatRngStateForTests(createCombatRngState(0x1234));
    playerAttack();
    advanceEnemyTurn();

    const state = getCombatState()!;
    expect(state.bossPhase ?? 0).toBe(0);
    expect(bossPhaseEvent).not.toHaveBeenCalled();

    eventBus.off('combat:boss_phase', bossPhaseEvent);
  });
});

describe('special-attack telegraph (integration)', () => {
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

  it('a charged special executes GUARANTEED on the enemy’s next turn', () => {
    const telegraphEvent = vi.fn();
    eventBus.on('combat:telegraph', telegraphEvent);

    startCombat('system_daemon', { skipPresentation: true });
    setCombatRngStateForTests(createCombatRngState(0x1234));

    // Preset a charge (as if the previous enemy turn rolled a special) —
    // daemon_system_crash stuns the player and applies a logic drain.
    const state = getCombatState()!;
    setCombatStateForTests({
      ...state,
      enemy: {
        ...state.enemy,
        chargingSpecial: { attackId: 'daemon_system_crash', name: 'Сбой Системы', turnsToHit: 1 },
      },
      isPlayerTurn: true,
    });

    playerDefend();
    advanceEnemyTurn();

    const after = getCombatState()!;
    // The charge was consumed and the special fired regardless of RNG
    expect(after.enemy.chargingSpecial ?? null).toBeNull();
    expect(after.log.some((l) => l.text.includes('Сбой Системы!'))).toBe(true);
    // Special cooldown: execute sets cooldown+1 (4), then gotoEnemyTurnEnd
    // immediately decrements by 1 → 3 remaining turns of cooldown.
    expect(after.enemy.specialCooldown).toBe(3);
    // The special's stun fired — the duration-1 skip_turn buff is CONSUMED by
    // transitionToPlayerTurn (that's the stun working: the player's turn is
    // auto-skipped), so assert on the durable logic-drain debuff + the log.
    expect(after.buffs.some((b) => b.effect.type === 'stat_drain' && b.target === 'player')).toBe(true);
    expect(after.log.some((l) => l.text.includes('оглушены'))).toBe(true);

    eventBus.off('combat:telegraph', telegraphEvent);
  });

  it('enemy spends its turn CHARGING when a special roll succeeds (no instant special)', () => {
    // Empirically find an RNG seed whose first special roll succeeds
    // (system_daemon: system_crash chance 0.3).
    let charged = false;
    let seedFound: number | null = null;

    for (let seed = 0; seed < 500 && !charged; seed++) {
      disposeCombatSystem();
      startCombat('system_daemon', { skipPresentation: true });
      setCombatRngStateForTests(createCombatRngState(seed));
      playerAttack();
      advanceEnemyTurn();
      const state = getCombatState();
      if (state?.status === 'active' && state.enemy.chargingSpecial) {
        charged = true;
        seedFound = seed;
        expect(state.enemy.chargingSpecial.attackId).toBe('daemon_system_crash');
        expect(state.enemy.chargingSpecial.turnsToHit).toBe(1);
        expect(state.log.some((l) => l.text.includes('готовит'))).toBe(true);
        // The charge turn dealt no special damage — the player only lost HP
        // to a basic attack (or nothing if the enemy's stun skipped first).
      }
    }

    expect(charged).toBe(true);
    expect(seedFound).not.toBeNull();
  });
});
