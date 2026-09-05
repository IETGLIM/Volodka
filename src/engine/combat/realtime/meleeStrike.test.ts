/* ─── v4.8.7/v4.8.8/v4.11.0: тесты реал-тайм слоя «Опережающий удар» ───
 * Гейты фазы мокаются по образцу CombatSystem.test.ts; геометрия — через
 * настоящую resolveMeleeSweep. Проверяются: замах/попадание, LOS-фильтр,
 * кулдаун, выносливость, реестр целей, HUD-зеркало подсказки, добивание
 * ослабленного крипа до боя (creepVitality, v4.8.8): награды, события и
 * запрет повторной встречи, а также стелс «Удар в спину» (v4.11.0):
 * чистая геометрия isBehindCreep, двойной гейт осведомлённости/дуги,
 * контракт applyStrike({ introHpPct, backstab }) и тихое добивание +25% XP.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/engine/GameActionDispatcher', () => ({
  getGameSnapshot: () => ({
    mode: 'exploration',
    exploration: { playerPosition: [0, 0, 0] as [number, number, number] },
    difficultySettings: { creditsMultiplier: 1 },
  }),
  dispatchGameAction: (action: unknown) => dispatchAction(action),
}));

vi.mock('@/engine/interaction/interactionSession', () => ({
  isInteractionLocked: () => false,
}));

vi.mock('@/engine/core/sceneTransitionGuard', () => ({
  isSceneTransitionInProgress: () => false,
}));

vi.mock('@/engine/cinematic/cinematicTimelineOrchestrator', () => ({
  isCinematicTimelineActive: () => false,
}));

const consumeStamina = vi.fn((_amount: number) => true);
const dispatchAction = vi.fn();

vi.mock('@/engine/player/playerStamina', () => ({
  consumePlayerStamina: (amount: number) => consumeStamina(amount),
  getPlayerStamina: () => ({ current: 100, max: 100, ratio: 1, exhausted: false, sprintDraining: false }),
}));

import { eventBus } from '@/engine/EventBus';
import { sharedCameraYawRef } from '@/engine/PlayerRotationState';
import {
  attemptMeleeStrike,
  getMeleeStrikeHint,
  isBehindCreep,
  MELEE_STRIKE_BACKSTAB_INTRO_HP_PCT,
  MELEE_STRIKE_COOLDOWN_MS,
  MELEE_STRIKE_INTRO_ENEMY_HP_PCT,
  MELEE_STRIKE_STAMINA_COST,
  registerMeleeStrikeTarget,
  reportMeleeStrikeCandidate,
  resetMeleeStrikeForTests,
  type MeleeStrikeEngageOptions,
  type MeleeStrikeTarget,
} from '@/engine/combat/realtime/meleeStrike';
import {
  noteCreepWeakened,
  resetCreepVitalityForTests,
} from '@/engine/combat/realtime/creepVitality';

function makeTarget(overrides: Partial<MeleeStrikeTarget> = {}): MeleeStrikeTarget & {
  strikes: number;
  finished: number;
  /** v4.11.0: контракт applyStrike захватывается — тесты проверяют,
   *  что решение о силе ослабления пришло готовым от attemptMeleeStrike. */
  lastStrikeOptions: MeleeStrikeEngageOptions | null;
} {
  const target = {
    id: 'creep_test',
    name: 'Тестовый демон',
    enemyType: 'system_daemon' as const,
    strikes: 0,
    finished: 0,
    lastStrikeOptions: null as MeleeStrikeEngageOptions | null,
    getPosition: () => ({ x: 0, y: 0.9, z: 2.0 }),
    canStrike: () => true,
    hasLineOfSight: () => true,
    applyStrike: (options?: MeleeStrikeEngageOptions) => {
      target.strikes += 1;
      target.lastStrikeOptions = options ?? null;
    },
    applyFinisher: () => { target.finished += 1; },
    ...overrides,
  };
  return target as MeleeStrikeTarget & {
    strikes: number;
    finished: number;
    lastStrikeOptions: MeleeStrikeEngageOptions | null;
  };
}

describe('meleeStrike (v4.8.7 «Опережающий удар»)', () => {
  beforeEach(() => {
    resetMeleeStrikeForTests();
    resetCreepVitalityForTests();
    consumeStamina.mockClear();
    dispatchAction.mockClear();
    consumeStamina.mockImplementation(() => true);
    sharedCameraYawRef.current = 0; // взгляд вдоль +Z
  });

  afterEach(() => {
    resetMeleeStrikeForTests();
    resetCreepVitalityForTests();
    vi.restoreAllMocks();
  });

  it('strike in reach and cone → hit: event, message, applyStrike, stamina', () => {
    const target = makeTarget();
    registerMeleeStrikeTarget(target);

    const strikes: unknown[] = [];
    const unsub = eventBus.on('combat:melee_strike', (payload) => strikes.push(payload));

    const outcome = attemptMeleeStrike('mouse');
    expect(outcome.status).toBe('hit');
    expect(outcome.status === 'hit' && outcome.finished).toBe(false);
    expect(target.strikes).toBe(1);
    expect(target.finished).toBe(0);
    expect(consumeStamina).toHaveBeenCalledWith(MELEE_STRIKE_STAMINA_COST);
    expect(strikes).toHaveLength(1);
    expect(strikes[0]).toMatchObject({ creepId: 'creep_test', hit: true, finished: false, x: 0, z: 2.0 });
    unsub();
  });

  it('target behind the player (outside the cone) → none, no strike', () => {
    const target = makeTarget({ getPosition: () => ({ x: 0, y: 0.9, z: -2.0 }) });
    registerMeleeStrikeTarget(target);
    const outcome = attemptMeleeStrike('mouse');
    expect(outcome.status).toBe('none');
    expect(target.strikes).toBe(0);
    expect(consumeStamina).not.toHaveBeenCalled();
  });

  it('blocked line of sight → none even inside the cone', () => {
    const target = makeTarget({ hasLineOfSight: () => false });
    registerMeleeStrikeTarget(target);
    const outcome = attemptMeleeStrike('mouse');
    expect(outcome.status).toBe('none');
    expect(target.strikes).toBe(0);
  });

  it('cooldown blocks only when a target is actually in the sweep', () => {
    const target = makeTarget();
    registerMeleeStrikeTarget(target);

    expect(attemptMeleeStrike('mouse').status).toBe('hit');

    // Цель есть, но кулдаун не прошёл.
    expect(attemptMeleeStrike('mouse').status).toBe('cooldown');
    expect(target.strikes).toBe(1);

    // После кулдауна бьёт снова (Date.now под шпионом — кулдаун истёк).
    const realNow = Date.now();
    const nowSpy = vi
      .spyOn(Date, 'now')
      .mockReturnValue(realNow + MELEE_STRIKE_COOLDOWN_MS + 1);
    expect(attemptMeleeStrike('mouse').status).toBe('hit');
    expect(target.strikes).toBe(2);
    nowSpy.mockRestore();
  });

  it('insufficient stamina → tired, strike not applied', () => {
    const target = makeTarget();
    registerMeleeStrikeTarget(target);
    consumeStamina.mockImplementation(() => false);

    const outcome = attemptMeleeStrike('mouse');
    expect(outcome.status).toBe('tired');
    expect(target.strikes).toBe(0);
  });

  it('ineligible target (engaged/cooldown) is skipped entirely', () => {
    const target = makeTarget({ canStrike: () => false });
    registerMeleeStrikeTarget(target);
    expect(attemptMeleeStrike('mouse').status).toBe('none');
  });

  it('hint mirror: nearest eligible candidate, removed when ineligible', () => {
    const near = makeTarget({ id: 'creep_near' });
    const far = makeTarget({ id: 'creep_far' });
    registerMeleeStrikeTarget(near);
    registerMeleeStrikeTarget(far);

    reportMeleeStrikeCandidate('creep_near', 'Близкий', 1.5, true);
    reportMeleeStrikeCandidate('creep_far', 'Далёкий', 2.5, true);

    const hint = getMeleeStrikeHint();
    expect(hint?.id).toBe('creep_near');
    expect(hint?.finishable).toBe(false);

    reportMeleeStrikeCandidate('creep_near', 'Близкий', 1.5, false);
    expect(getMeleeStrikeHint()?.id).toBe('creep_far');

    reportMeleeStrikeCandidate('creep_far', 'Далёкий', 2.5, false);
    expect(getMeleeStrikeHint()).toBeNull();
  });
});

describe('meleeStrike: добивание ослабленного крипа (v4.8.8)', () => {
  beforeEach(() => {
    resetMeleeStrikeForTests();
    resetCreepVitalityForTests();
    consumeStamina.mockClear();
    dispatchAction.mockClear();
    consumeStamina.mockImplementation(() => true);
    sharedCameraYawRef.current = 0;
  });

  afterEach(() => {
    resetMeleeStrikeForTests();
    resetCreepVitalityForTests();
    vi.restoreAllMocks();
  });

  it('finishable target (≤35% hp) → finished: no encounter, rewards dispatched', () => {
    const target = makeTarget({ getFinisherXpReward: () => 25 });
    registerMeleeStrikeTarget(target);
    noteCreepWeakened('creep_test', 0.3); // после побега игрока

    const strikes: unknown[] = [];
    const finishes: unknown[] = [];
    const unsubStrike = eventBus.on('combat:melee_strike', (p) => strikes.push(p));
    const unsubFinish = eventBus.on('combat:creep_finished', (p) => finishes.push(p));

    const outcome = attemptMeleeStrike('mouse');

    expect(outcome).toEqual({ status: 'hit', creepId: 'creep_test', enemyName: 'Тестовый демон', finished: true });
    // Встреча НЕ стартует — пошаговая фаза пропущена.
    expect(target.strikes).toBe(0);
    expect(target.finished).toBe(1);

    // Урезанные награды: floor(25*0.6)=15 XP, карма 2, кредиты ≥ 1.
    const types = dispatchAction.mock.calls.map((c) => (c[0] as { type: string; amount?: number }).type);
    expect(types).toEqual(['player/addKarma', 'player/addXp', 'player/addCredits']);
    const amounts = dispatchAction.mock.calls.map((c) => (c[0] as { amount?: number }).amount);
    expect(amounts[0]).toBe(2);
    expect(amounts[1]).toBe(15);
    expect(amounts[2]).toBeGreaterThanOrEqual(1);

    // События: strike с finished:true + creep_finished с наградами.
    expect(strikes).toHaveLength(1);
    expect(strikes[0]).toMatchObject({ creepId: 'creep_test', hit: true, finished: true });
    expect(finishes).toHaveLength(1);
    expect(finishes[0]).toMatchObject({
      creepId: 'creep_test',
      enemyType: 'system_daemon',
      enemyName: 'Тестовый демон',
      xpGained: 15,
      karmaGained: 2,
    });

    // Память HP очищена — крип повержен.
    unsubStrike();
    unsubFinish();
  });

  it('weakened target above threshold → normal weakened encounter (finished: false)', () => {
    const target = makeTarget();
    registerMeleeStrikeTarget(target);
    noteCreepWeakened('creep_test', 0.6);

    const outcome = attemptMeleeStrike('mouse');
    expect(outcome.status === 'hit' && outcome.finished).toBe(false);
    expect(target.strikes).toBe(1);
    expect(target.finished).toBe(0);
    expect(dispatchAction).not.toHaveBeenCalled();
  });

  it('finishable target without applyFinisher falls back to the encounter', () => {
    const target = makeTarget();
    delete (target as Partial<MeleeStrikeTarget>).applyFinisher;
    registerMeleeStrikeTarget(target);
    noteCreepWeakened('creep_test', 0.2);

    const outcome = attemptMeleeStrike('mouse');
    expect(outcome.status === 'hit' && outcome.finished).toBe(false);
    expect(target.strikes).toBe(1);
    expect(dispatchAction).not.toHaveBeenCalled();
  });

  it('fresh (full-hp) target never finishes', () => {
    const target = makeTarget();
    registerMeleeStrikeTarget(target);
    // Никаких noteCreepWeakened — крип здоров.
    const outcome = attemptMeleeStrike('mouse');
    expect(outcome.status === 'hit' && outcome.finished).toBe(false);
    expect(target.strikes).toBe(1);
  });

  it('hint mirror reports the finishable flag of the candidate', () => {
    const target = makeTarget({ id: 'creep_weak' });
    registerMeleeStrikeTarget(target);

    reportMeleeStrikeCandidate('creep_weak', 'Ослабленный', 1.5, true, true);
    expect(getMeleeStrikeHint()).toMatchObject({ id: 'creep_weak', finishable: true });

    reportMeleeStrikeCandidate('creep_weak', 'Ослабленный', 1.5, true, false);
    expect(getMeleeStrikeHint()).toMatchObject({ id: 'creep_weak', finishable: false });
  });
});

describe('meleeStrike: удар в спину (v4.11.0 «стелс»)', () => {
  beforeEach(() => {
    resetMeleeStrikeForTests();
    resetCreepVitalityForTests();
    consumeStamina.mockClear();
    dispatchAction.mockClear();
    consumeStamina.mockImplementation(() => true);
    sharedCameraYawRef.current = 0; // взгляд игрока вдоль +Z, крип в (0, 2)
  });

  afterEach(() => {
    resetMeleeStrikeForTests();
    resetCreepVitalityForTests();
    vi.restoreAllMocks();
  });

  it('isBehindCreep: задняя дуга ≥ ~100° за спиной → true', () => {
    // Крип смотрит вдоль +Z (yaw = 0), игрок прямо за спиной (−Z).
    expect(isBehindCreep(0, 0, -2)).toBe(true);
    // Ровно на пороге: cos(100°) ≈ −0.1736 ≤ −0.17 → ещё «в спине».
    expect(isBehindCreep(0, 2 * Math.sin(100 * (Math.PI / 180)), 2 * Math.cos(100 * (Math.PI / 180)))).toBe(true);
    // Чуть уже порога (99°, cos ≈ −0.1564) — спиной уже не считается.
    expect(isBehindCreep(0, 2 * Math.sin(99 * (Math.PI / 180)), 2 * Math.cos(99 * (Math.PI / 180)))).toBe(false);
    // Конвенция forward = (sin(yaw), cos(yaw)): крип смотрит вдоль +X
    // (yaw = π/2), игрок за его спиной (−X).
    expect(isBehindCreep(Math.PI / 2, -2, 0)).toBe(true);
  });

  it('isBehindCreep: бок (90°) вне задней дуги → false', () => {
    // 90° сбоку — скаляр 0, вне задней дуги.
    expect(isBehindCreep(0, 2, 0)).toBe(false);
    // 95° — почти сзади, но дуга ещё не набрана (cos ≈ −0.087).
    expect(isBehindCreep(0, 2 * Math.sin(95 * (Math.PI / 180)), 2 * Math.cos(95 * (Math.PI / 180)))).toBe(false);
  });

  it('isBehindCreep: перед взглядом крипа → false', () => {
    // Прямо перед взглядом (0°) и в полуконусе передней полусферы.
    expect(isBehindCreep(0, 0, 2)).toBe(false);
    expect(isBehindCreep(0, 1, 1.7)).toBe(false);
  });

  it('stealth engage: неосведомлённый крип спиной → introHpPct 0.5, backstab в событии, «Удар в спину»', () => {
    // Крип в (0, 2) смотрит от игрока (yaw = 0 — вдоль +Z) и не в погоне.
    const target = makeTarget({ getFacingYaw: () => 0, isAware: () => false });
    registerMeleeStrikeTarget(target);

    const strikes: unknown[] = [];
    const messages: Array<{ text: string }> = [];
    const unsubStrike = eventBus.on('combat:melee_strike', (p) => strikes.push(p));
    const unsubMsg = eventBus.on('ui:exploration_message', (p) => messages.push(p as { text: string }));

    const outcome = attemptMeleeStrike('mouse');

    expect(outcome.status).toBe('hit');
    // Решение собрано движком: стелс-ослабление 0.5 + флаг backstab.
    expect(target.lastStrikeOptions).toEqual({
      introHpPct: MELEE_STRIKE_BACKSTAB_INTRO_HP_PCT,
      backstab: true,
    });
    expect(strikes).toHaveLength(1);
    expect(strikes[0]).toMatchObject({ creepId: 'creep_test', finished: false, backstab: true });
    expect(messages.some((m) => m.text.includes('Удар в спину'))).toBe(true);

    unsubStrike();
    unsubMsg();
  });

  it('creep facing the player → normal 0.75 path even in patrol', () => {
    // yaw = π: крип в (0, 2) смотрит на игрока (−Z) — геометрия не за спиной.
    const target = makeTarget({ getFacingYaw: () => Math.PI, isAware: () => false });
    registerMeleeStrikeTarget(target);

    const outcome = attemptMeleeStrike('mouse');
    expect(outcome.status).toBe('hit');
    expect(target.lastStrikeOptions).toEqual({ introHpPct: MELEE_STRIKE_INTRO_ENEMY_HP_PCT, backstab: false });
  });

  it('awareness gate: isAware() === true (chase) → normal path even from behind', () => {
    // Геометрия стелс-угодная, но крип в погоне — «в курсе».
    const target = makeTarget({ getFacingYaw: () => 0, isAware: () => true });
    registerMeleeStrikeTarget(target);

    const outcome = attemptMeleeStrike('mouse');
    expect(outcome.status).toBe('hit');
    expect(target.lastStrikeOptions).toEqual({ introHpPct: MELEE_STRIKE_INTRO_ENEMY_HP_PCT, backstab: false });
  });

  it('targets without stealth providers follow the normal path (backward compat)', () => {
    // Базовый makeTarget не даёт getFacingYaw/isAware — бодрствующая цель.
    const target = makeTarget();
    registerMeleeStrikeTarget(target);

    const outcome = attemptMeleeStrike('mouse');
    expect(outcome.status).toBe('hit');
    expect(target.lastStrikeOptions).toEqual({ introHpPct: MELEE_STRIKE_INTRO_ENEMY_HP_PCT, backstab: false });
  });

  it('creep vitality (0.6) outranks stealth — backstab does not stack on remembered damage', () => {
    const target = makeTarget({ getFacingYaw: () => 0, isAware: () => false });
    registerMeleeStrikeTarget(target);
    noteCreepWeakened('creep_test', 0.6); // побег из прошлой встречи

    const outcome = attemptMeleeStrike('mouse');
    expect(outcome.status).toBe('hit');
    // Память HP сильнее стелса: 0.6 остаётся 0.6, но удар всё равно стелс.
    expect(target.lastStrikeOptions).toEqual({ introHpPct: 0.6, backstab: true });
  });

  it('quiet finisher: backstab finisher pays 18 xp, «Тихое добивание» message', () => {
    const target = makeTarget({
      getFinisherXpReward: () => 25,
      getFacingYaw: () => 0,
      isAware: () => false,
    });
    registerMeleeStrikeTarget(target);
    noteCreepWeakened('creep_test', 0.3); // ≤ 35% → добивание

    const strikes: unknown[] = [];
    const messages: Array<{ text: string }> = [];
    const unsubStrike = eventBus.on('combat:melee_strike', (p) => strikes.push(p));
    const unsubMsg = eventBus.on('ui:exploration_message', (p) => messages.push(p as { text: string }));

    const outcome = attemptMeleeStrike('mouse');

    expect(outcome.status === 'hit' && outcome.finished).toBe(true);
    expect(target.finished).toBe(1);
    // floor(25 × 0.6 × 1.25) = 18 против 15 без стелса; карма неизменна.
    const amounts = dispatchAction.mock.calls.map((c) => (c[0] as { amount?: number }).amount);
    expect(amounts).toContain(18);
    expect(amounts).toContain(2);
    expect(strikes[0]).toMatchObject({ finished: true, backstab: true });
    expect(messages.some((m) => m.text.includes('Тихое добивание'))).toBe(true);

    unsubStrike();
    unsubMsg();
  });

  it('plain finisher (no stealth) keeps the 60% xp without the bonus', () => {
    // Провайдеров стелса нет — добивание «в лоб», бонус не начисляется.
    const target = makeTarget({ getFinisherXpReward: () => 25 });
    registerMeleeStrikeTarget(target);
    noteCreepWeakened('creep_test', 0.2);

    const strikes: unknown[] = [];
    const unsubStrike = eventBus.on('combat:melee_strike', (p) => strikes.push(p));

    const outcome = attemptMeleeStrike('mouse');
    expect(outcome.status === 'hit' && outcome.finished).toBe(true);
    const amounts = dispatchAction.mock.calls.map((c) => (c[0] as { amount?: number }).amount);
    expect(amounts).toContain(15);
    expect(amounts).not.toContain(18);
    expect(strikes[0]).toMatchObject({ finished: true, backstab: false });

    unsubStrike();
  });

  it('hint mirror reports the backstab state of the candidate', () => {
    reportMeleeStrikeCandidate('creep_st', 'Скрытный', 1.5, true, false, true);
    expect(getMeleeStrikeHint()).toMatchObject({ id: 'creep_st', backstab: true });

    reportMeleeStrikeCandidate('creep_st', 'Скрытный', 1.5, true, false, false);
    expect(getMeleeStrikeHint()).toMatchObject({ id: 'creep_st', backstab: false });

    // Дефолт без стелс-аргумента — обычная цель.
    reportMeleeStrikeCandidate('creep_st', 'Скрытный', 1.5, true);
    expect(getMeleeStrikeHint()).toMatchObject({ id: 'creep_st', backstab: false });
  });
});
