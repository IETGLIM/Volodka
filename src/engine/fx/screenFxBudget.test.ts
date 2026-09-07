/**
 * Тесты бюджета экранных FX (аудит этап 32 — iGPU).
 * Проверяют монотонность бюджета по тирам: low строже всех, ultra щедрее
 * всех, и каждый следующий тир не урезает возможности предыдущего.
 */

import { describe, expect, it } from 'vitest';
import { QUALITY_PRESETS, QUALITY_PRESET_ORDER } from '@/engine/graphics/qualityPresets';
import { resolveScreenFxBudget, type ScreenFxBudget } from './screenFxBudget';

describe('screenFxBudget', () => {
  it('возвращает бюджет для каждого пресета детерминированно', () => {
    for (const id of QUALITY_PRESET_ORDER) {
      const preset = QUALITY_PRESETS[id];
      const budget = resolveScreenFxBudget(preset);
      expect(budget).toBe(resolveScreenFxBudget(preset));
      expect(budget.maxOverlayLayers).toBeGreaterThanOrEqual(1);
      expect(budget.glitchCanvasMaxDpr).toBeGreaterThanOrEqual(1);
    }
  });

  it('low — самый строгий: 1 оверлей, без хроматики/blend/пульсаций', () => {
    const low = resolveScreenFxBudget(QUALITY_PRESETS.low);
    expect(low.maxOverlayLayers).toBe(1);
    expect(low.mergeRedundantDamageFlashes).toBe(true);
    expect(low.allowChromatic).toBe(false);
    expect(low.allowBlendModes).toBe(false);
    expect(low.allowInfinitePulses).toBe(false);
    expect(low.mergeVitalsVignettes).toBe(true);
    expect(low.glitchCanvasMaxDpr).toBe(1);
    expect(low.allowEdgeStrips).toBe(false);
  });

  it('бюджет не ужесточается при росте тира (low→ultra)', () => {
    const budgets: ScreenFxBudget[] = QUALITY_PRESET_ORDER.map(
      (id) => resolveScreenFxBudget(QUALITY_PRESETS[id]),
    );
    for (let i = 1; i < budgets.length; i++) {
      const prev = budgets[i - 1];
      const next = budgets[i];
      expect(next.maxOverlayLayers).toBeGreaterThanOrEqual(prev.maxOverlayLayers);
      expect(next.glitchCanvasMaxDpr).toBeGreaterThanOrEqual(prev.glitchCanvasMaxDpr);
      if (prev.allowChromatic) expect(next.allowChromatic).toBe(true);
      if (prev.allowBlendModes) expect(next.allowBlendModes).toBe(true);
      if (prev.allowInfinitePulses) expect(next.allowInfinitePulses).toBe(true);
      if (prev.allowEdgeStrips) expect(next.allowEdgeStrips).toBe(true);
    }
  });

  it('medium не имеет blend-режимов (iGPU), ultra — имеет', () => {
    expect(resolveScreenFxBudget(QUALITY_PRESETS.medium).allowBlendModes).toBe(false);
    expect(resolveScreenFxBudget(QUALITY_PRESETS.ultra).allowBlendModes).toBe(true);
    expect(resolveScreenFxBudget(QUALITY_PRESETS.ultra).maxOverlayLayers).toBe(4);
  });
});
