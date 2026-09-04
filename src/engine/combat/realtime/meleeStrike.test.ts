/* ─── v4.8.7: тесты реал-тайм слоя «Опережающий удар» (meleeStrike.ts) ───
 * Гейты фазы мокаются по образцу CombatSystem.test.ts; геометрия — через
 * настоящую resolveMeleeSweep. Проверяются: замах/попадание, LOS-фильтр,
 * кулдаун, выносливость, реестр целей и HUD-зеркало подсказки.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/engine/GameActionDispatcher', () => ({
  getGameSnapshot: () => ({
    mode: 'exploration',
    exploration: { playerPosition: [0, 0, 0] as [number, number, number] },
  }),
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

function makeTarget(overrides: Partial<MeleeStrikeTarget> = {}): MeleeStrikeTarget & { strikes: number } {
  const target = {
    id: 'creep_test',
    name: 'Тестовый демон',
    strikes: 0,
    getPosition: () => ({ x: 0, y: 0.9, z: 2.0 }),
    canStrike: () => true,
    hasLineOfSight: () => true,
    applyStrike: () => { target.strikes += 1; },
    ...overrides,
  };
  return target as MeleeStrikeTarget & { strikes: number };
}

describe('meleeStrike (v4.8.7 «Опережающий удар»)', () => {
  beforeEach(() => {
    resetMeleeStrikeForTests();
    consumeStamina.mockClear();
    consumeStamina.mockImplementation(() => true);
    sharedCameraYawRef.current = 0; // взгляд вдоль +Z
  });

  afterEach(() => {
    resetMeleeStrikeForTests();
    vi.restoreAllMocks();
  });

  it('strike in reach and cone → hit: event, message, applyStrike, stamina', () => {
    const target = makeTarget();
    registerMeleeStrikeTarget(target);

    const strikes: unknown[] = [];
    const unsub = eventBus.on('combat:melee_strike', (payload) => strikes.push(payload));

    const outcome = attemptMeleeStrike('mouse');
    expect(outcome.status).toBe('hit');
    expect(target.strikes).toBe(1);
    expect(consumeStamina).toHaveBeenCalledWith(MELEE_STRIKE_STAMINA_COST);
    expect(strikes).toHaveLength(1);
    expect(strikes[0]).toMatchObject({ creepId: 'creep_test', hit: true, x: 0, z: 2.0 });
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

    reportMeleeStrikeCandidate('creep_near', 'Близкий', 1.5, false);
    expect(getMeleeStrikeHint()?.id).toBe('creep_far');

    reportMeleeStrikeCandidate('creep_far', 'Далёкий', 2.5, false);
    expect(getMeleeStrikeHint()).toBeNull();
  });
});
