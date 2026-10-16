import { describe, expect, it, beforeEach, vi } from 'vitest';

import {
  cancelActiveRoll,
  clearRollRequest,
  consumeRollRequest,
  getRollCooldown,
  getRollDirection,
  getRollElapsed,
  getRollSpeed,
  isPlayerRolling,
  queueRollRequest,
  resetPlayerRollForNewSession,
  tryStartRoll,
  tickPlayerRoll,
} from './playerRoll';

import {
  ROLL_COOLDOWN,
  ROLL_DURATION,
  ROLL_SPEED,
  ROLL_STAMINA_COST,
} from './playerConstants';

import { resetPlayerStaminaForNewSession } from './playerStamina';

/* consumePlayerStamina внутри playerRoll работает с shared-стаминой.
 * Перед каждым тестом восстанавливаем её — иначе стамина «течёт»
 * между тестами (roll — не единственный её потребитель в рантайме). */

describe('playerRoll (кувырок, v4.52.0)', () => {
  beforeEach(() => {
    resetPlayerRollForNewSession();
    resetPlayerStaminaForNewSession();
  });

  describe('очередь запроса', () => {
    it('пустая очередь не выдаёт запрос', () => {
      expect(consumeRollRequest()).toBe(false);
    });

    it('свежий запрос consumится один раз', () => {
      queueRollRequest();
      expect(consumeRollRequest()).toBe(true);
      expect(consumeRollRequest()).toBe(false);
    });

    it('протухший запрос не выдаётся (окно валидности)', () => {
      queueRollRequest();
      // Прокручиваем время за пределы окна
      vi.spyOn(performance, 'now').mockReturnValue(performance.now() + 10_000);
      try {
        expect(consumeRollRequest()).toBe(false);
      } finally {
        vi.restoreAllMocks();
      }
    });

    it('clearRollRequest сбрасывает очередь', () => {
      queueRollRequest();
      clearRollRequest();
      expect(consumeRollRequest()).toBe(false);
    });
  });

  describe('старт кувырка', () => {
    it('стартует и нормализует направление', () => {
      const ok = tryStartRoll(3, 4); // длина 5 → нормализация 0.6/0.8
      expect(ok).toBe(true);
      expect(isPlayerRolling()).toBe(true);
      const dir = getRollDirection();
      expect(dir.x).toBeCloseTo(0.6, 5);
      expect(dir.z).toBeCloseTo(0.8, 5);
    });

    it('нулевой вектор → дефолтное направление (вперёд, +Z)', () => {
      expect(tryStartRoll(0, 0)).toBe(true);
      const dir = getRollDirection();
      expect(dir.x).toBe(0);
      expect(dir.z).toBe(1);
    });

    it('повторный старт во время кувырка запрещён', () => {
      expect(tryStartRoll(0, 1)).toBe(true);
      expect(tryStartRoll(1, 0)).toBe(false);
    });

    it('после окончания действует кулдаун', () => {
      expect(tryStartRoll(0, 1)).toBe(true);
      tickPlayerRoll(ROLL_DURATION + 0.001);
      expect(isPlayerRolling()).toBe(false);
      expect(getRollCooldown()).toBeCloseTo(ROLL_COOLDOWN, 5);
      expect(tryStartRoll(0, 1)).toBe(false);
    });

    it('кулдаун тикает и отпускает', () => {
      tryStartRoll(0, 1);
      tickPlayerRoll(ROLL_DURATION + 0.001);
      tickPlayerRoll(ROLL_COOLDOWN + 0.01);
      expect(getRollCooldown()).toBe(0);
    });
  });

  describe('скорость и таймер', () => {
    it('в начале кувырка скорость = ROLL_SPEED', () => {
      tryStartRoll(0, 1);
      expect(getRollSpeed(0)).toBeCloseTo(ROLL_SPEED, 5);
    });

    it('монотонно убывает и хвост ≥ доли удержания', () => {
      tryStartRoll(0, 1);
      let prev = Infinity;
      for (let t = 0; t <= ROLL_DURATION; t += ROLL_DURATION / 10) {
        const v = getRollSpeed(t);
        expect(v).toBeLessThanOrEqual(prev);
        expect(v).toBeGreaterThanOrEqual(ROLL_SPEED * 0.35 - 1e-6);
        prev = v;
      }
    });

    it('elapsed растёт и обнуляется после конца', () => {
      tryStartRoll(0, 1);
      tickPlayerRoll(0.1);
      expect(getRollElapsed()).toBeCloseTo(0.1, 5);
      tickPlayerRoll(ROLL_DURATION);
      expect(isPlayerRolling()).toBe(false);
      expect(getRollElapsed()).toBe(0);
    });
  });

  describe('сбросы', () => {
    it('cancelActiveRoll гасит активный кувырок без кулдауна', () => {
      tryStartRoll(0, 1);
      cancelActiveRoll();
      expect(isPlayerRolling()).toBe(false);
      expect(getRollCooldown()).toBe(0);
    });

    it('resetPlayerRollForNewSession сбрасывает и очередь', () => {
      tryStartRoll(0, 1);
      tickPlayerRoll(ROLL_DURATION + 0.001);
      resetPlayerRollForNewSession();
      expect(getRollCooldown()).toBe(0);
      expect(isPlayerRolling()).toBe(false);
    });
  });

  describe('стамина', () => {
    it('без стамины старт отклоняется (нет частичного расхода)', () => {
      // Стамина полна (100) → ровно floor(100/14)=7 кувырков, дальше — отказ.
      let started = 0;
      for (let i = 0; i < 20; i++) {
        tickPlayerRoll(ROLL_DURATION + 0.001); // закрываем предыдущий
        tickPlayerRoll(ROLL_COOLDOWN + 0.01); // ждём кулдаун
        if (tryStartRoll(0, 1)) started++;
      }
      expect(started).toBe(Math.floor(100 / ROLL_STAMINA_COST));
    });
  });
});
