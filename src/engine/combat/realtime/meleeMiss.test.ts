/* ─── v4.12.0: тесты «честного промаха» — чистый RNG скоупа замаха ───
 * Шанс промаха: база 0.06; линейный рост до +0.14 на кромке reach (2.7 м)
 * И края конуса (~58.4°); point-blank (≤ 1.4 м) — база без надбавок;
 * стелс (isBackstab) и добивание (isFinishable) — детерминированные 0;
 * жёсткий потолок 0.35, зажим отрицательных. Бросок инжектится (rng):
 * () => 0 — всегда попадание, () => 0.999 — промах при любом шансе ≥
 * 0.001. Для чтения ЧИСТОГО шанса в тестах используется бросок
 * «always miss» () => 0.999 — он гарантирует промах и возвращает шанс.
 */

import { describe, expect, it, vi } from 'vitest';
import {
  clampMeleeMissChance,
  computeMeleeMissChance,
  MELEE_MISS_BASE,
  MELEE_MISS_EDGE_BONUS,
  MELEE_MISS_HALF_ANGLE_DEG,
  MELEE_MISS_HARD_CAP,
} from '@/engine/combat/realtime/meleeMiss';
import {
  MELEE_STRIKE_HALF_ANGLE_RAD,
  MELEE_STRIKE_POINT_BLANK_M,
  MELEE_STRIKE_REACH_M,
} from '@/engine/combat/realtime/meleeSweep';

/** Бросок «всегда промах»: 0.999 ≥ 1 − шанс при любом шансе ≥ 0.001. */
const alwaysMiss = () => 0.999;

describe('meleeMiss: чистый шанс промаха (v4.12.0)', () => {
  it('point-blank (≤ 1.4 м) — базовый шанс без надбавок (угол не важен)', () => {
    expect(
      computeMeleeMissChance({ distanceMeters: 0.5, angleDeg: 0, rng: alwaysMiss }),
    ).toBeCloseTo(MELEE_MISS_BASE, 9);
    // Граница point-blank: даже на краю конуса надбавки нет.
    expect(
      computeMeleeMissChance({
        distanceMeters: MELEE_STRIKE_POINT_BLANK_M,
        angleDeg: MELEE_MISS_HALF_ANGLE_DEG,
        rng: alwaysMiss,
      }),
    ).toBeCloseTo(MELEE_MISS_BASE, 9);
  });

  it('рост к кромке: reach-дистанция и край конуса дают больше базы', () => {
    // Полу-угол конуса унаследован от meleeSweep (1.02 рад ≈ 58.4°).
    expect(MELEE_MISS_HALF_ANGLE_DEG).toBeCloseTo((MELEE_STRIKE_HALF_ANGLE_RAD * 180) / Math.PI, 9);

    const atReach = computeMeleeMissChance({
      distanceMeters: MELEE_STRIKE_REACH_M,
      angleDeg: 0,
      rng: alwaysMiss,
    });
    expect(atReach).toBeCloseTo(MELEE_MISS_BASE + MELEE_MISS_EDGE_BONUS, 9);

    // Чуть за point-blank на краю конуса — надбавка за угол уже полная.
    const atConeEdge = computeMeleeMissChance({
      distanceMeters: MELEE_STRIKE_POINT_BLANK_M + 0.01,
      angleDeg: MELEE_MISS_HALF_ANGLE_DEG,
      rng: alwaysMiss,
    });
    expect(atConeEdge).toBeGreaterThan(atReach);

    // Обе кромки сразу — дизайн-максимум 0.34, под жёстким капом 0.35.
    const atBothEdges = computeMeleeMissChance({
      distanceMeters: MELEE_STRIKE_REACH_M,
      angleDeg: MELEE_MISS_HALF_ANGLE_DEG,
      rng: alwaysMiss,
    });
    expect(atBothEdges).toBeCloseTo(MELEE_MISS_BASE + 2 * MELEE_MISS_EDGE_BONUS, 9);
    expect(atBothEdges).toBeLessThan(MELEE_MISS_HARD_CAP);
  });

  it('стелс (isBackstab) и добивание (isFinishable) — всегда 0, бросок не расходуется', () => {
    const rng = vi.fn(alwaysMiss);
    expect(
      computeMeleeMissChance({
        distanceMeters: MELEE_STRIKE_REACH_M,
        angleDeg: MELEE_MISS_HALF_ANGLE_DEG,
        isBackstab: true,
        rng,
      }),
    ).toBe(0);
    expect(
      computeMeleeMissChance({
        distanceMeters: MELEE_STRIKE_REACH_M,
        angleDeg: MELEE_MISS_HALF_ANGLE_DEG,
        isFinishable: true,
        rng,
      }),
    ).toBe(0);
    // Детерминированные ветки честны: кубик даже не бросается.
    expect(rng).not.toHaveBeenCalled();
  });

  it('жёсткий потолок 0.35: clamp режет сверху, вся сетка факторов под капом', () => {
    expect(clampMeleeMissChance(1)).toBe(MELEE_MISS_HARD_CAP);
    expect(clampMeleeMissChance(0.5)).toBe(MELEE_MISS_HARD_CAP);
    // Дизайн-максимум (0.34) не режется — кап только страховка.
    expect(clampMeleeMissChance(MELEE_MISS_BASE + 2 * MELEE_MISS_EDGE_BONUS)).toBeCloseTo(
      MELEE_MISS_BASE + 2 * MELEE_MISS_EDGE_BONUS,
      12,
    );

    for (let d = 0; d <= 4; d += 0.25) {
      for (let a = 0; a <= 90; a += 5) {
        const chance = computeMeleeMissChance({ distanceMeters: d, angleDeg: a, rng: alwaysMiss });
        expect(chance).toBeLessThanOrEqual(MELEE_MISS_HARD_CAP);
        expect(chance).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('зажим отрицательных: отрицательные дистанция/угол не дают отрицательного шанса', () => {
    expect(clampMeleeMissChance(-0.5)).toBe(0);
    // Факторы зажаты в [0..1] — отрицательные входы дают чистую базу.
    expect(
      computeMeleeMissChance({ distanceMeters: -3, angleDeg: -45, rng: alwaysMiss }),
    ).toBeCloseTo(MELEE_MISS_BASE, 9);
  });

  it('rng=()=>0 — всегда попадание, даже на кромке reach и конуса', () => {
    expect(
      computeMeleeMissChance({
        distanceMeters: MELEE_STRIKE_REACH_M,
        angleDeg: MELEE_MISS_HALF_ANGLE_DEG,
        rng: () => 0,
      }),
    ).toBe(0);
    expect(
      computeMeleeMissChance({ distanceMeters: 2.0, angleDeg: 30, rng: () => 0 }),
    ).toBe(0);
  });

  it('rng=()=>0.999 при шансе < 1 — промах; бросок ровно на пороге — промах (≥)', () => {
    const chance = computeMeleeMissChance({ distanceMeters: 2.0, angleDeg: 0, rng: alwaysMiss });
    expect(chance).toBeGreaterThan(0);
    expect(chance).toBeLessThanOrEqual(MELEE_MISS_HARD_CAP);

    // Граница включена: rng() = 1 − шанс → промах с тем же значением шанса.
    expect(
      computeMeleeMissChance({ distanceMeters: 2.0, angleDeg: 0, rng: () => 1 - chance }),
    ).toBe(chance);
  });

  it('монотонность: дальше и «краше» угол — промах только вероятнее', () => {
    const c15 = computeMeleeMissChance({ distanceMeters: 1.5, angleDeg: 0, rng: alwaysMiss });
    const c20 = computeMeleeMissChance({ distanceMeters: 2.0, angleDeg: 0, rng: alwaysMiss });
    const c27 = computeMeleeMissChance({
      distanceMeters: MELEE_STRIKE_REACH_M,
      angleDeg: 0,
      rng: alwaysMiss,
    });
    expect(c15).toBeLessThan(c20);
    expect(c20).toBeLessThan(c27);

    const a10 = computeMeleeMissChance({ distanceMeters: 2.0, angleDeg: 10, rng: alwaysMiss });
    const a30 = computeMeleeMissChance({ distanceMeters: 2.0, angleDeg: 30, rng: alwaysMiss });
    const aEdge = computeMeleeMissChance({
      distanceMeters: 2.0,
      angleDeg: MELEE_MISS_HALF_ANGLE_DEG,
      rng: alwaysMiss,
    });
    expect(a10).toBeLessThan(a30);
    expect(a30).toBeLessThan(aEdge);
  });
});
