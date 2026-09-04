/* ─── v4.8.7 «Опережающий удар»: introHpPct при старте боя ───
 * Реал-тайм слой (meleeStrike.ts) передаёт долю HP через EncounterContext →
 * CombatStartOptions. Проверяем контракт startCombatImmediate: враг вступает
 * ослабленным, log содержит строку удара; без опции — полные HP.
 * Мок-снапшот повторяет CombatSystem.test.ts (нормальная сложность).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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
  difficultySettings: {
    difficulty: 'normal',
    enemyDamageMultiplier: 1,
    enemyHealthMultiplier: 1,
    playerDamageMultiplier: 1,
    xpMultiplier: 1,
    creditsMultiplier: 1,
    skillCheckThreshold: 0,
    stressAccumulationRate: 1,
    energyRegenRate: 1,
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
  startCombat,
} from '@/engine/CombatSystem';

describe('startCombat introHpPct (v4.8.7 «Опережающий удар»)', () => {
  beforeEach(() => {
    dispatchGameAction.mockClear();
    disposeCombatSystem();
  });

  afterEach(() => {
    disposeCombatSystem();
    vi.restoreAllMocks();
  });

  it('enemy enters with reduced hp and a strike log line', () => {
    startCombat('system_daemon', { skipPresentation: true, introHpPct: 0.5 });
    const cs = getCombatState();
    expect(cs).not.toBeNull();
    expect(cs!.enemy.maxHp).toBeGreaterThan(0);
    expect(cs!.enemy.hp).toBe(Math.max(1, Math.floor(cs!.enemy.maxHp * 0.5)));
    expect(cs!.log.some((line) => line.text.includes('Опережающий удар'))).toBe(true);
  });

  it('without the option the enemy enters at full hp and without the strike line', () => {
    startCombat('system_daemon', { skipPresentation: true });
    const cs = getCombatState()!;
    expect(cs.enemy.hp).toBe(cs.enemy.maxHp);
    expect(cs.log.some((line) => line.text.includes('Опережающий удар'))).toBe(false);
  });

  it('invalid pct (>= 1 or <= 0) keeps full hp', () => {
    startCombat('system_daemon', { skipPresentation: true, introHpPct: 1.5 });
    expect(getCombatState()!.enemy.hp).toBe(getCombatState()!.enemy.maxHp);

    disposeCombatSystem();
    startCombat('system_daemon', { skipPresentation: true, introHpPct: 0 });
    expect(getCombatState()!.enemy.hp).toBe(getCombatState()!.enemy.maxHp);
  });

  it('tiny pct floors at 1 hp (enemy is not pre-killed)', () => {
    startCombat('system_daemon', { skipPresentation: true, introHpPct: 0.0001 });
    expect(getCombatState()!.enemy.hp).toBe(1);
  });
});
