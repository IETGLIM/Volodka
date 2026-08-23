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
    rngSeed: 0x5678,
    combatEncounterSeq: 0,
    skills: { coding: 10, logic: 10, empathy: 10, writing: 10, intuition: 10 },
    progression: {
      level: 4,
      currentAct: 3,
      unlockedSkills: [] as string[],
      unlockedPerks: [] as string[],
    },
    stress: 0,
    flags: {} as Record<string, boolean>,
    inventory: [] as unknown[],
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

/** Сокрушительный удар: HP врага → 1, следующий playerAttack завершает бой. */
function bringEnemyToOneHp() {
  const cs = getCombatState()!;
  setCombatStateForTests({ ...cs, enemy: { ...cs.enemy, hp: 1 } });
}

describe('волна из двух врагов (v4.7.8, integration)', () => {
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

  it('падение первого врага при непустой очереди = смена цели, не победа', () => {
    const waveSwapEvent = vi.fn();
    eventBus.on('combat:wave_swap', waveSwapEvent);

    startCombat('system_daemon', {
      skipPresentation: true,
      pendingEnemies: ['corporate_golem'],
    });
    setCombatRngStateForTests(createCombatRngState(0x2468));

    const first = getCombatState()!;
    expect(first.enemy.type).toBe('system_daemon');
    expect(first.pendingEnemies).toEqual(['corporate_golem']);

    bringEnemyToOneHp();
    playerAttack(); // первый падает

    const afterSwap = getCombatState()!;
    expect(afterSwap.status).toBe('active'); // БОЙ ПРОДОЛЖАЕТСЯ
    expect(afterSwap.enemy.type).toBe('corporate_golem'); // второй вступил
    expect(afterSwap.enemy.hp).toBe(afterSwap.enemy.maxHp); // на полном HP
    expect(afterSwap.pendingEnemies).toEqual([]); // очередь пуста
    expect(afterSwap.isPlayerTurn).toBe(true); // инициатива у игрока
    // Лог содержит оба бита: повержен + вступает
    expect(afterSwap.log.some((l) => l.text.includes('повержен'))).toBe(true);
    expect(afterSwap.log.some((l) => l.text.includes('вступает в бой'))).toBe(true);
    // Половинные награды за первого начислены (addCredits виден в dispatch)
    expect(dispatchGameAction.mock.calls.some(([a]) => (a as { type: string }).type === 'player/addCredits')).toBe(true);
    // Типизированное событие для UI
    expect(waveSwapEvent).toHaveBeenCalledWith(
      expect.objectContaining({ defeatedType: 'system_daemon', nextType: 'corporate_golem' }),
    );

    eventBus.off('combat:wave_swap', waveSwapEvent);
  });

  it('второй враг добивается — обычная победа с полными наградами', () => {
    startCombat('system_daemon', {
      skipPresentation: true,
      pendingEnemies: ['corporate_golem'],
    });
    setCombatRngStateForTests(createCombatRngState(0x2468));

    bringEnemyToOneHp();
    playerAttack(); // wave swap → corporate_golem

    advanceEnemyTurn();
    const mid = getCombatState()!;
    expect(mid.status).toBe('active');

    bringEnemyToOneHp();
    playerAttack(); // второй падает — очередь пуста

    const finalState = getCombatState()!;
    expect(finalState.status).toBe('victory'); // настоящая победа только сейчас
    expect(finalState.rewards).toBeDefined();
  });

  it('пустая очередь (классический 1v1) — победа сразу', () => {
    startCombat('system_daemon', { skipPresentation: true });
    setCombatRngStateForTests(createCombatRngState(0x2468));

    bringEnemyToOneHp();
    playerAttack();

    const finalState = getCombatState()!;
    expect(finalState.status).toBe('victory'); // без волны — сразу победа
  });

  it('смена цели сбрасывает телеграф и баффы врага, баффы игрока живут', () => {
    startCombat('system_daemon', {
      skipPresentation: true,
      pendingEnemies: ['corporate_golem'],
    });
    setCombatRngStateForTests(createCombatRngState(0x2468));

    // Телеграф первого врага + баффы обеих сторон.
    const cs = getCombatState()!;
    setCombatStateForTests({
      ...cs,
      enemy: {
        ...cs.enemy,
        hp: 1,
        chargingSpecial: { attackId: 'daemon_system_crash', name: 'Сбой Системы', turnsToHit: 1 },
      },
      buffs: [
        {
          id: 'p1', name: 'Защита', sourceId: 'player_defend', kind: 'buff',
          target: 'player', duration: 2, effect: { type: 'damage_reduction', value: 0.3 },
        } as never,
        {
          id: 'e1', name: 'Ярость', sourceId: 'daemon_rage', kind: 'buff',
          target: 'enemy', duration: 3, effect: { type: 'attack_boost', value: 5 },
        } as never,
      ],
    });

    playerAttack(); // wave swap

    const after = getCombatState()!;
    expect(after.enemy.chargingSpecial ?? null).toBeNull(); // телеграф сброшен
    expect(after.buffs.some((b) => b.target === 'enemy')).toBe(false); // баффы врага умерли
    expect(after.buffs.some((b) => b.target === 'player')).toBe(true); // игрока живут
  });

  it('rollEncounterWave: шансы по актам и отсутствие дубля первого врага', async () => {
    const { rollEncounterWave } = await import('@/engine/combat/enemies');
    // Акт 1–2 — волны нет никогда.
    expect(rollEncounterWave(1, 5, 50, 0.01, 'system_daemon')).toBeNull();
    expect(rollEncounterWave(2, 5, 50, 0.01, 'system_daemon')).toBeNull();
    // Акт 3, roll ниже порога 0.15 — второй враг есть и не дубль первого.
    const wave = rollEncounterWave(3, 4, 50, 0.05, 'system_daemon');
    expect(wave).not.toBeNull();
    expect(wave).not.toBe('system_daemon');
    // Акт 3, roll выше порога — волны нет.
    expect(rollEncounterWave(3, 4, 50, 0.5, 'system_daemon')).toBeNull();
    // Акт 7 — порог 0.35.
    expect(rollEncounterWave(7, 8, 50, 0.3, 'system_daemon')).not.toBeNull();
    expect(rollEncounterWave(7, 8, 50, 0.9, 'system_daemon')).toBeNull();
  });
});
