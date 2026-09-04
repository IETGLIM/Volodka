/* ─── v4.8.8: тесты памяти HP крипов (creepVitality.ts) ───
 * Проверяются: запись/чтение остатка HP, зажим 0..1, полные HP снимают
 * ослабление, монотонность (минимум при повторном ранении), регенерация
 * по времени, порог добивания, точечная и полная очистка. */

import { beforeEach, describe, expect, it } from 'vitest';
import {
  CREEP_VITALITY_REGEN_MS,
  MELEE_STRIKE_FINISHER_HP_PCT,
  clearAllCreepVitality,
  clearCreepVitality,
  getCreepWeakenedHpPct,
  isCreepFinishable,
  noteCreepWeakened,
  resetCreepVitalityForTests,
} from '@/engine/combat/realtime/creepVitality';

describe('creepVitality (v4.8.8)', () => {
  beforeEach(() => {
    resetCreepVitalityForTests();
  });

  it('stores and returns the weakened hp fraction', () => {
    noteCreepWeakened('creep_a', 0.6, 1_000);
    expect(getCreepWeakenedHpPct('creep_a', 2_000)).toBe(0.6);
    expect(getCreepWeakenedHpPct('creep_b', 2_000)).toBeNull();
  });

  it('clamps the fraction into 0..1', () => {
    noteCreepWeakened('creep_a', 1.7, 1_000);
    // Полные HP снимают ослабление целиком.
    expect(getCreepWeakenedHpPct('creep_a', 2_000)).toBeNull();

    noteCreepWeakened('creep_b', -0.5, 1_000);
    expect(getCreepWeakenedHpPct('creep_b', 2_000)).toBe(0);
  });

  it('ignores non-finite input', () => {
    noteCreepWeakened('creep_a', Number.NaN, 1_000);
    expect(getCreepWeakenedHpPct('creep_a', 2_000)).toBeNull();
  });

  it('keeps the minimum on repeated weakening (monotonic)', () => {
    noteCreepWeakened('creep_a', 0.5, 1_000);
    noteCreepWeakened('creep_a', 0.3, 2_000);
    expect(getCreepWeakenedHpPct('creep_a', 3_000)).toBe(0.3);
    // Более высокое «ранение» не лечит крип.
    noteCreepWeakened('creep_a', 0.9, 4_000);
    expect(getCreepWeakenedHpPct('creep_a', 5_000)).toBe(0.3);
  });

  it('regenerates to full after the regen window', () => {
    noteCreepWeakened('creep_a', 0.4, 1_000);
    expect(getCreepWeakenedHpPct('creep_a', 1_000 + CREEP_VITALITY_REGEN_MS)).toBe(0.4);
    // Ровно на границе окна ещё жив, после — регенерировал.
    expect(getCreepWeakenedHpPct('creep_a', 1_000 + CREEP_VITALITY_REGEN_MS + 1)).toBeNull();
  });

  it('expired entry can be weakened again from scratch', () => {
    noteCreepWeakened('creep_a', 0.3, 1_000);
    noteCreepWeakened('creep_a', 0.8, 1_000 + CREEP_VITALITY_REGEN_MS + 1);
    expect(getCreepWeakenedHpPct('creep_a', 2_000)).toBe(0.8);
  });

  it('finisher threshold boundary matches the constant', () => {
    expect(MELEE_STRIKE_FINISHER_HP_PCT).toBe(0.35);
    expect(isCreepFinishable(0.35)).toBe(true);
    expect(isCreepFinishable(0.349)).toBe(true);
    expect(isCreepFinishable(0)).toBe(true);
    expect(isCreepFinishable(0.3501)).toBe(false);
    expect(isCreepFinishable(1)).toBe(false);
  });

  it('clears one entry and all entries', () => {
    noteCreepWeakened('creep_a', 0.5, 1_000);
    noteCreepWeakened('creep_b', 0.5, 1_000);
    clearCreepVitality('creep_a');
    expect(getCreepWeakenedHpPct('creep_a', 2_000)).toBeNull();
    expect(getCreepWeakenedHpPct('creep_b', 2_000)).toBe(0.5);
    clearAllCreepVitality();
    expect(getCreepWeakenedHpPct('creep_b', 2_000)).toBeNull();
  });
});
