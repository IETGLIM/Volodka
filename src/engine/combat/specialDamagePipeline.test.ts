import { describe, expect, it, vi, beforeEach } from 'vitest';
import { computeSpecialIncomingDamage, computeEnemyIncomingDamage } from './enemyTurn';
import type { SpecialIncomingDamageParams, IncomingDamageParams } from './enemyTurn';
import { SeededCombatRng } from './combatRng';
import { ENEMY_TEMPLATES } from './enemies';
import type { CombatState } from './types';
import type { CombatEnemy, CombatBuff } from '@/shared/types/game';
import type { CombatPerkModifiers } from '@/shared/perks/perkModifiers';

// getPlayerDefense() reads from the game store — mock it for pure unit tests
// (same pattern as enemyTurn.test.ts).
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

function makeBossEnemy(overrides: Partial<CombatEnemy> = {}): CombatEnemy {
  return makeEnemy({
    type: 'boss_catacombs_keeper',
    name: 'Хранитель Катакомб',
    emoji: '💀',
    hp: 500,
    maxHp: 500,
    attack: 20,
    defense: 14,
    speed: 10,
    ...overrides,
  });
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

function makeDefendBuff(): CombatBuff {
  return {
    id: 'defend_1',
    name: 'Защита',
    source: 'player_defend',
    kind: 'buff',
    target: 'player',
    duration: 1,
    effect: { type: 'damage_reduction', value: 0.3 },
  };
}

function makeParams(overrides: Partial<SpecialIncomingDamageParams> = {}): SpecialIncomingDamageParams {
  return {
    combatState: makeCombatState(),
    rawDamage: 100,
    spiritualSkillCount: 0,
    perkMods: { ...EMPTY_PERK_MODS },
    ...overrides,
  };
}

/* ═══════════════════════════════════════════════════════════════
   computeSpecialIncomingDamage — special-attack defense pipeline
   (Task 3.3-b1: «Защита» and buffs must work against specials)
   ═══════════════════════════════════════════════════════════════ */

describe('computeSpecialIncomingDamage', () => {
  beforeEach(() => {
    mockGetPlayerDefense.mockReturnValue(8);
  });

  it('passes raw damage through unchanged with no defenses (non-boss, no buffs)', () => {
    const result = computeSpecialIncomingDamage(makeParams({ rawDamage: 77 }));
    expect(result.damage).toBe(77);
    expect(result.playerDefending).toBe(false);
  });

  it('floors at MIN_DAMAGE (1) for tiny raw values', () => {
    const result = computeSpecialIncomingDamage(makeParams({ rawDamage: 0 }));
    expect(result.damage).toBeGreaterThanOrEqual(1);
  });

  it('defend buff reduces special damage (defense pipeline applies)', () => {
    const defended = computeSpecialIncomingDamage(makeParams({
      combatState: makeCombatState({ buffs: [makeDefendBuff()] }),
    }));
    // Layer 3: computeDefendedDamage(100, 8) = floor(100*0.5 - 8*0.3) = 47
    // Layer 5: defend buff's own damage_reduction 0.3 → floor(47 × 0.7) = 32
    expect(defended.damage).toBe(32);
    expect(defended.playerDefending).toBe(true);
  });

  it('defense_boost buff applies a flat reduction', () => {
    const result = computeSpecialIncomingDamage(makeParams({
      combatState: makeCombatState({
        buffs: [{ id: 'db', name: 'Броня', source: 'test', kind: 'buff', target: 'player', duration: 2, effect: { type: 'defense_boost', value: 10 } }],
      }),
    }));
    expect(result.damage).toBe(90);
  });

  it('vulnerability (defense_reduction on player) amplifies damage', () => {
    const result = computeSpecialIncomingDamage(makeParams({
      combatState: makeCombatState({
        buffs: [{ id: 'dr', name: 'Слабость', source: 'test', kind: 'debuff', target: 'player', duration: 2, effect: { type: 'defense_reduction', value: 0.3 } }],
      }),
    }));
    // 100 × 1.3 = 130
    expect(result.damage).toBe(130);
  });

  it('telegraph counter-window: defending vs a CHARGED special cuts damage hard (extra ×0.4)', () => {
    const defendedOnly = computeSpecialIncomingDamage(makeParams({
      combatState: makeCombatState({ buffs: [makeDefendBuff()] }),
      telegraphed: false,
    }));
    const defendedCharged = computeSpecialIncomingDamage(makeParams({
      combatState: makeCombatState({ buffs: [makeDefendBuff()] }),
      telegraphed: true,
    }));
    // 32 (defended) → floor(32 × 0.4) = 12
    expect(defendedCharged.damage).toBe(12);
    expect(defendedCharged.damage).toBeLessThan(defendedOnly.damage);
  });

  it('telegraph flag alone does nothing when the player is NOT defending', () => {
    const plain = computeSpecialIncomingDamage(makeParams({ telegraphed: false }));
    const charged = computeSpecialIncomingDamage(makeParams({ telegraphed: true }));
    expect(charged.damage).toBe(plain.damage);
  });

  it('boss phase damage multiplier scales special damage at 30% HP (phase 3 ×1.6)', () => {
    const phase1 = computeSpecialIncomingDamage(makeParams({
      combatState: makeCombatState({ enemy: makeBossEnemy({ hp: 500 }) }),
    }));
    const phase3 = computeSpecialIncomingDamage(makeParams({
      combatState: makeCombatState({ enemy: makeBossEnemy({ hp: 150 }) }),
    }));
    expect(phase1.damage).toBe(100);
    expect(phase3.damage).toBe(160);
  });

  it('spiritual skills reduce special damage (5% per skill)', () => {
    const result = computeSpecialIncomingDamage(makeParams({ spiritualSkillCount: 3 }));
    // 100 × (1 - 0.15) = 85
    expect(result.damage).toBe(85);
  });

  it('perk incomingDamageReduction reduces special damage', () => {
    const result = computeSpecialIncomingDamage(makeParams({
      perkMods: { ...EMPTY_PERK_MODS, incomingDamageReduction: 0.2 },
    }));
    expect(result.damage).toBe(80);
  });
});

/* ═══════════════════════════════════════════════════════════════
   computeEnemyIncomingDamage — boss phase multiplier (basic attacks)
   ═══════════════════════════════════════════════════════════════ */

describe('computeEnemyIncomingDamage boss phase multiplier', () => {
  beforeEach(() => {
    mockGetPlayerDefense.mockReturnValue(8);
  });

  function basicAttackParams(enemy: CombatEnemy): IncomingDamageParams {
    return {
      combatState: makeCombatState({ enemy }),
      rng: SeededCombatRng.fromState({ state: 0x5eed, rolls: 0, pity: { rollsSinceCrit: 0, rollsSinceHit: 0 } }),
      currentAct: 1,
      currentLevel: 1,
      spiritualSkillCount: 0,
      perkMods: { ...EMPTY_PERK_MODS },
    };
  }

  it('boss at 60%/30% HP deals more damage than at full HP (×1.0 → ×1.3 → ×1.6)', () => {
    const full = computeEnemyIncomingDamage(basicAttackParams(makeBossEnemy({ hp: 500 })));
    const phase2 = computeEnemyIncomingDamage(basicAttackParams(makeBossEnemy({ hp: 300 })));
    const phase3 = computeEnemyIncomingDamage(basicAttackParams(makeBossEnemy({ hp: 150 })));

    expect(phase2.damage).toBeGreaterThan(full.damage);
    expect(phase3.damage).toBeGreaterThan(phase2.damage);
  });

  it('non-boss damage is unchanged by the phase multiplier', () => {
    const a = computeEnemyIncomingDamage(basicAttackParams(makeEnemy({ hp: 50 })));
    const b = computeEnemyIncomingDamage(basicAttackParams(makeEnemy({ hp: 5 })));
    // Same attack/variance seed → identical roll; phases don't apply to regular enemies
    expect(a.damage).toBe(b.damage);
  });
});

/* ═══════════════════════════════════════════════════════════════
   Boss specials route through the defense pipeline
   (previously raw damage — audit 2-c P1)
   ═══════════════════════════════════════════════════════════════ */

describe('boss specials vs player defense', () => {
  beforeEach(() => {
    mockGetPlayerDefense.mockReturnValue(8);
  });

  const overload = ENEMY_TEMPLATES.boss_neuro_sys.specialAttacks.find(
    (s) => s.id === 'neuro_overload',
  );

  it('neuro_overload is defined', () => {
    expect(overload).toBeDefined();
  });

  it('defending reduces neuro_overload damage (pipeline applies to boss specials)', () => {
    const boss = makeBossEnemy({ type: 'boss_neuro_sys', attack: 22 });
    const openState = makeCombatState({ enemy: boss, playerHp: 200, playerMaxHp: 200 });
    const defendedState = makeCombatState({
      enemy: boss,
      playerHp: 200,
      playerMaxHp: 200,
      buffs: [makeDefendBuff()],
    });

    const openResult = overload!.execute(openState, boss);
    const defendedResult = overload!.execute(defendedState, boss);

    const openDamage = 200 - openResult.playerHp;
    const defendedDamage = 200 - defendedResult.playerHp;

    expect(openDamage).toBeGreaterThan(0);
    expect(defendedDamage).toBeGreaterThan(0);
    // The whole point of the fix: «Защита» now works against boss specials
    expect(defendedDamage).toBeLessThan(openDamage);
  });

  it('telegraphed neuro_overload (chargingSpecial set) + defend cuts damage even harder', () => {
    const boss = makeBossEnemy({ type: 'boss_neuro_sys', attack: 22 });
    const defendedState = makeCombatState({
      enemy: { ...boss, chargingSpecial: { attackId: 'neuro_overload', name: 'Перегрузка Системы', turnsToHit: 1 } },
      playerHp: 200,
      playerMaxHp: 200,
      buffs: [makeDefendBuff()],
    });
    const defendedPlain = makeCombatState({
      enemy: boss,
      playerHp: 200,
      playerMaxHp: 200,
      buffs: [makeDefendBuff()],
    });

    const chargedResult = overload!.execute(defendedState, defendedState.enemy);
    const plainResult = overload!.execute(defendedPlain, boss);

    const chargedDamage = 200 - chargedResult.playerHp;
    const plainDamage = 200 - plainResult.playerHp;

    expect(chargedDamage).toBeLessThan(plainDamage);
  });
});
