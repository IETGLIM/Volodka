/* ─── v4.8.8: тесты единой формулы торгового отношения (tradingData.ts) ───
 * resolveTradeRelationValue — чистый хелпер, общий для TradingPanel
 * (отображение) и playerEconomySlice (транзакции). Проверяются: смесь
 * 80/20, отсутствие фракции, зажим 0..100, округление и защита от
 * нечисловых входов. */

import { describe, expect, it } from 'vitest';
import {
  TRADE_FACTION_WEIGHT,
  resolveTradeRelationValue,
} from '@/data/tradingData';

describe('resolveTradeRelationValue (v4.8.8)', () => {
  it('blends 80% personal + 20% faction average', () => {
    expect(TRADE_FACTION_WEIGHT).toBe(0.2);
    // 60*0.8 + 80*0.2 = 64
    expect(resolveTradeRelationValue(60, 80)).toBe(64);
    // 90*0.8 + 70*0.2 = 86
    expect(resolveTradeRelationValue(90, 70)).toBe(86);
    // Равные значения не меняются смесью.
    expect(resolveTradeRelationValue(50, 50)).toBe(50);
  });

  it('rounds the blended value', () => {
    // 55*0.8 + 74*0.2 = 44 + 14.8 = 58.8 → 59
    expect(resolveTradeRelationValue(55, 74)).toBe(59);
  });

  it('uses personal relation when there is no faction context (null)', () => {
    expect(resolveTradeRelationValue(73, null)).toBe(73);
    expect(resolveTradeRelationValue(0, null)).toBe(0);
  });

  it('falls back to personal on non-finite faction average', () => {
    expect(resolveTradeRelationValue(66, Number.NaN)).toBe(66);
    expect(resolveTradeRelationValue(66, Number.POSITIVE_INFINITY)).toBe(66);
  });

  it('clamps the result into 0..100', () => {
    expect(resolveTradeRelationValue(120, 100)).toBe(100);
    expect(resolveTradeRelationValue(-10, 0)).toBe(0);
  });

  it('falls back to neutral 50 when personal is not a number', () => {
    expect(resolveTradeRelationValue(Number.NaN, null)).toBe(50);
    expect(resolveTradeRelationValue(Number.NaN, 50)).toBe(50);
  });
});
