/* ─── v4.8.7/v4.8.8: тесты реал-тайм слоя «Опережающий удар» (meleeStrike.ts) ───
 * Гейты фазы мокаются по образцу CombatSystem.test.ts; геометрия — через
 * настоящую resolveMeleeSweep. Проверяются: замах/попадание, LOS-фильтр,
 * кулдаун, выносливость, реестр целей, HUD-зеркало подсказки, а также
 * добивание ослабленного крипа до боя (creepVitality, v4.8.8): награды,
 * события и запрет повторной встречи.
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
  MELEE_STRIKE_COOLDOWN_MS,
  MELEE_STRIKE_STAMINA_COST,
  attemptMeleeStrike,
  getMeleeStrikeHint,
  registerMeleeStrikeTarget,
  reportMeleeStrikeCandidate,
  resetMeleeStrikeForTests,
  type MeleeStrikeTarget,
} from '@/engine/combat/realtime/meleeStrike';
import {
  noteCreepWeakened,
  resetCreepVitalityForTests,
} from '@/engine/combat/realtime/creepVitality';

function makeTarget(overrides: Partial<MeleeStrikeTarget> = {}): MeleeStrikeTarget & { strikes: number; finished: number } {
  const target = {
    id: 'creep_test',
    name: 'Тестовый демон',
    enemyType: 'system_daemon' as const,
    strikes: 0,
    finished: 0,
    getPosition: () => ({ x: 0, y: 0.9, z: 2.0 }),
    canStrike: () => true,
    hasLineOfSight: () => true,
    applyStrike: () => { target.strikes += 1; },
    applyFinisher: () => { target.finished += 1; },
    ...overrides,
  };
  return target as MeleeStrikeTarget & { strikes: number; finished: number };
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
