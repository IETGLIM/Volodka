/* ─── Volodka RPG – честный промах замаха: чистый RNG скоупа (v4.12.0) ───
 *
 * Четвёртый инкремент бэклога «реал-тайм 3D-комбат»: замах больше не
 * гарантированное попадание. Шанс промаха растёт с дистанцией и «кра-
 * ёстью» угла — у кромки reach и на краю конуса удара промах вероятнее,
 * вплотную (point-blank) замах почти верен. Стелс-удар в спину и
 * добивание ДЕТЕРМИНИРОВАНЫ (шанс 0): они уже гейтятся геометрией
 * (задняя дуга неосведомлённого крипа) и состоянием цели (≤ 35% HP) —
 * честный RNG их не оспаривает.
 *
 * ПРАВИЛО СЛОЯ: никаких импортов Three/Rapier/стора — как meleeSweep.ts.
 * Вызывается из meleeStrike.ts (движок) и юнит-тестов.
 *
 * Формула шанса (0..MELEE_MISS_HARD_CAP):
 *   base = 0.06
 *     + 0.14 × distFactor  (0 на point-blank 1.4 м → 1 на reach 2.7 м)
 *     + 0.14 × angleFactor (0 в центре взгляда → 1 на краю конуса ~58.4°)
 *   point-blank (≤ 1.4 м) — база БЕЗ надбавок (угол не важен);
 *   зажим [0, 0.35].
 *
 * Бросок (rng инжектится параметром для тестируемости; в рантайме
 * Math.random): промах, если rng() ≥ 1 − шанс — то есть P(промах) =
 * шанс при rng() ~ U[0,1). rng = () => 0 — всегда попадание;
 * () => 0.999 — промах при любом шансе ≥ 0.001.
 */

import {
  MELEE_STRIKE_HALF_ANGLE_RAD,
  MELEE_STRIKE_POINT_BLANK_M,
  MELEE_STRIKE_REACH_M,
} from './meleeSweep';

/** Базовый шанс промаха (вплотную замах почти верен). */
export const MELEE_MISS_BASE = 0.06;

/** Надбавка на кромке: расстояние до reach ИЛИ угол до края конуса
 *  каждый добавляют до +0.14 (суммарно до +0.28 к базе). */
export const MELEE_MISS_EDGE_BONUS = 0.14;

/** Жёсткий потолок шанса промаха — честно, но не обидно. */
export const MELEE_MISS_HARD_CAP = 0.35;

/** Кулдаун после промаха (сек) — вдвое короче обычного 0.9 с:
 *  честный second-chance (стамина за промах уже потрачена). */
export const MELEE_MISS_COOLDOWN_SEC = 0.45;

/** Полу-раствор конуса удара в градусах (1.02 рад из meleeSweep ≈ 58.4°). */
export const MELEE_MISS_HALF_ANGLE_DEG = (MELEE_STRIKE_HALF_ANGLE_RAD * 180) / Math.PI;

export interface ComputeMeleeMissChanceInput {
  /** Дистанция игрок → цель (метры, как distM из resolveMeleeSweep). */
  distanceMeters: number;
  /** Отклонение цели от центра взгляда (градусы, 0 — прямо перед собой). */
  angleDeg: number;
  /** Удар в спину неосведомлённого крипа — детерминированное попадание. */
  isBackstab?: boolean;
  /** Добивание ослабленного крипа — детерминированное поражение. */
  isFinishable?: boolean;
  /** Инжектируемый бросок (в рантайме Math.random). */
  rng: () => number;
}

/** Зажим шанса в честные рамки [0, MELEE_MISS_HARD_CAP]. */
export function clampMeleeMissChance(raw: number): number {
  return Math.min(Math.max(raw, 0), MELEE_MISS_HARD_CAP);
}

/** Надбавка за дистанцию: 0 до point-blank, линейно до +EDGE на reach. */
function distanceBonus(distanceMeters: number): number {
  if (distanceMeters <= MELEE_STRIKE_POINT_BLANK_M) return 0;
  const span = MELEE_STRIKE_REACH_M - MELEE_STRIKE_POINT_BLANK_M;
  const t = Math.min(
    Math.max((distanceMeters - MELEE_STRIKE_POINT_BLANK_M) / span, 0),
    1,
  );
  return MELEE_MISS_EDGE_BONUS * t;
}

/** Надбавка за угол: 0 в центре взгляда, линейно до +EDGE на краю конуса. */
function angleBonus(angleDeg: number): number {
  const t = Math.min(Math.max(angleDeg / MELEE_MISS_HALF_ANGLE_DEG, 0), 1);
  return MELEE_MISS_EDGE_BONUS * t;
}

/**
 * Решение попытки замаха: считает шанс промаха по скоупу (дистанция +
 * угол) и честно бросает инжектируемый rng.
 *
 * Возвращает ЭФФЕКТИВНЫЙ шанс промаха (number в 0..1):
 *   • 0  — удар засчитан (попадание): детерминированная ветка
 *          (стелс/добивание), нулевой шанс или удачный бросок;
 *   • >0 — ПРОМАХ; число — шанс этого промаха (уходит в событие
 *          combat:melee_miss).
 */
export function computeMeleeMissChance(input: ComputeMeleeMissChanceInput): number {
  // Стелс-удар и добивание детерминированы: они уже гейтятся геометрией
  // (задняя дуга) и состоянием (≤ 35% HP) — RNG их не оспаривает.
  if (input.isBackstab || input.isFinishable) return 0;

  // Point-blank: базовый шанс без надбавок — вплотную мимо почти нельзя.
  const chance = clampMeleeMissChance(
    input.distanceMeters <= MELEE_STRIKE_POINT_BLANK_M
      ? MELEE_MISS_BASE
      : MELEE_MISS_BASE + distanceBonus(input.distanceMeters) + angleBonus(input.angleDeg),
  );
  if (chance <= 0) return 0;

  // Честный бросок: промах, если rng() ≥ 1 − шанс (P(промах) = шанс).
  return input.rng() >= 1 - chance ? chance : 0;
}
