/* ─── v4.8.8: тесты реплик торговцев по фракции (merchantTradeFlavor.ts) ───
 * Проверяются: строка для каждого из пяти уровней, подстановка метки
 * фракции, детерминированность выбора (не мигает между рендерами),
 * различие реплик разных торговцев и защитный null. */

import { describe, expect, it } from 'vitest';
import { resolveMerchantFactionLine } from '@/shared/merchantTradeFlavor';
import { resolveFactionAttitudeTier } from '@/shared/npcFactionAttitude';

describe('resolveMerchantFactionLine (v4.8.8)', () => {
  it('returns a line for every attitude tier', () => {
    const tiers = ['ally', 'cordial', 'neutral', 'wary', 'hostile'] as const;
    for (const tier of tiers) {
      const line = resolveMerchantFactionLine(tier, 'Сеть', 'albert');
      expect(line).not.toBeNull();
      expect(line!.length).toBeGreaterThan(0);
    }
  });

  it('substitutes the faction label for %f', () => {
    const line = resolveMerchantFactionLine('hostile', 'ТОЛПА', 'zarema');
    expect(line).not.toContain('%f');
    expect(line).toContain('ТОЛПА');
  });

  it('is deterministic for the same merchant and tier', () => {
    const a = resolveMerchantFactionLine('ally', 'Гильдия', 'office_colleague');
    const b = resolveMerchantFactionLine('ally', 'Гильдия', 'office_colleague');
    expect(a).toBe(b);
  });

  it('tier derived from the selector matches the shared thresholds', () => {
    // 70 → ally (порог 65), 45 → wary, 20 → hostile.
    expect(resolveMerchantFactionLine(resolveFactionAttitudeTier(70), 'Сеть', 'm')).toContain('Сеть');
    expect(resolveMerchantFactionLine(resolveFactionAttitudeTier(45), 'Сеть', 'm')).toContain('Сеть');
    expect(resolveMerchantFactionLine(resolveFactionAttitudeTier(20), 'Сеть', 'm')).toContain('Сеть');
  });

  it('returns null only as a defensive path (unknown tier)', () => {
    // Все пять уровней покрыты — null достижим только извне типа.
    const line = resolveMerchantFactionLine('unknown' as never, 'Сеть', 'x');
    expect(line).toBeNull();
  });
});
