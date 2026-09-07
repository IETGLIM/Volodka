/**
 * Бюджет экранных FX (аудит этап 32 — «пиковые full-screen FX-слои»).
 *
 * Проблема: в пике комбата одновременно композиционировалось до 7
 * full-screen слоёв (flash + damage vignette + хроматика + низкое HP ×2 +
 * edge-полосы + glitch-canvas), каждый — отдельный композит-слой браузера.
 * На интегрированных GPU (iGPU) это fill-rate + compositing дропы кадра.
 *
 * Решение: единый бюджет по уровню качества. Один источник истины для
 * всех экранных эффектов: сколько оверлеев держать, можно ли blend-режимы,
 * бесконечные пульсации, merge дублирующих красных слоёв.
 *
 * Правило: новый экранный FX обязан читать resolveScreenFxBudget(preset)
 * и уважать бюджет. Низкий тир — 1 оверлей; ультра — 4.
 */

import type { QualityPreset } from '@/engine/graphics/qualityPresets';

export interface ScreenFxBudget {
  /** Максимум одновременных full-screen оверлеев (flash/damage/cinematic). */
  maxOverlayLayers: number;
  /** Пропускать мелкий красный flash, когда damage vignette уже красный. */
  mergeRedundantDamageFlashes: boolean;
  /** Разрешён ли слой хроматической аберрации (градиент по всему экрану). */
  allowChromatic: boolean;
  /** Разрешён ли mixBlendMode (форсит отдельный композит-проход). */
  allowBlendModes: boolean;
  /** Разрешены ли бесконечные пульсации винеток (low-HP heartbeat и т.п.). */
  allowInfinitePulses: boolean;
  /** Сливать винетки состояния (энергия/стресс + HP) в один слой. */
  mergeVitalsVignettes: boolean;
  /** Потолок DPR glitch-канваса (fill-rate full-screen 2D-перерисовки). */
  glitchCanvasMaxDpr: number;
  /** HUD edge-полосы хроматической рамки (узкие, дёшевы; гейтятся low-тиром). */
  allowEdgeStrips: boolean;
}

/** Low / iGPU: один оверлей, ноль blend-режимов, ноль бесконечных пульсаций. */
const LOW_BUDGET: ScreenFxBudget = {
  maxOverlayLayers: 1,
  mergeRedundantDamageFlashes: true,
  allowChromatic: false,
  allowBlendModes: false,
  allowInfinitePulses: false,
  mergeVitalsVignettes: true,
  glitchCanvasMaxDpr: 1,
  allowEdgeStrips: false,
};

/** Medium: 2 оверлея, хроматика без blend, статичные пульсации. */
const MEDIUM_BUDGET: ScreenFxBudget = {
  maxOverlayLayers: 2,
  mergeRedundantDamageFlashes: true,
  allowChromatic: true,
  allowBlendModes: false,
  allowInfinitePulses: false,
  mergeVitalsVignettes: true,
  glitchCanvasMaxDpr: 1.25,
  allowEdgeStrips: true,
};

/** High: полный стек, но оверлеи ограничены, DPR канваса capped. */
const HIGH_BUDGET: ScreenFxBudget = {
  maxOverlayLayers: 3,
  mergeRedundantDamageFlashes: false,
  allowChromatic: true,
  allowBlendModes: true,
  allowInfinitePulses: true,
  mergeVitalsVignettes: false,
  glitchCanvasMaxDpr: 2,
  allowEdgeStrips: true,
};

/** Ultra: максимум зрелищности. */
const ULTRA_BUDGET: ScreenFxBudget = {
  maxOverlayLayers: 4,
  mergeRedundantDamageFlashes: false,
  allowChromatic: true,
  allowBlendModes: true,
  allowInfinitePulses: true,
  mergeVitalsVignettes: false,
  glitchCanvasMaxDpr: 3,
  allowEdgeStrips: true,
};

const BUDGETS: Record<Exclude<QualityPreset['id'], never>, ScreenFxBudget> = {
  low: LOW_BUDGET,
  medium: MEDIUM_BUDGET,
  high: HIGH_BUDGET,
  ultra: ULTRA_BUDGET,
};

/** Бюджет FX для текущего пресета качества. Чистая функция, детерминирована. */
export function resolveScreenFxBudget(preset: Pick<QualityPreset, 'id'>): ScreenFxBudget {
  return BUDGETS[preset.id];
}
