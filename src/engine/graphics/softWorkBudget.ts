/**
 * Soft post / texture work gate — skip optional GPU cost under frame-budget pressure.
 * Used by ExplorationPostFX + Ultra 2048 texture resolve.
 */

import { subscribeRuntimeBudgetViolations } from '@/engine/performance/runtimeBudgetEvents';
import type { BudgetViolation } from '@/engine/performance/RuntimeBudgetMonitor';

const PRESSURE_HOLD_MS = 8_000;
const CLEAN_FOR_ULTRA_2048_MS = 30_000;

let lastFpsFailMs: number | null = null;
let bound = false;

function onViolations(violations: BudgetViolation[]): void {
  if (violations.some((v) => v.id === 'fps' && v.severity === 'fail')) {
    lastFpsFailMs = performance.now();
  }
}

/** Bind once at engine boot (idempotent). */
export function bindSoftWorkBudget(): void {
  if (bound) return;
  bound = true;
  subscribeRuntimeBudgetViolations(onViolations);
}

/** Soft FX (noise, chromatic, Ultra SMAA HIGH) allowed when budget is not under recent FPS fail. */
export function isSoftWorkAffordable(now = performance.now()): boolean {
  if (lastFpsFailMs == null) return true;
  return now - lastFpsFailMs > PRESSURE_HOLD_MS;
}

/**
 * Ultra 2048 DataTextures — only when explicitly enabled AND budget has been clean
 * long enough. Default Ultra stays at 1024 for 60fps feasibility.
 */
export function isUltra2048Affordable(now = performance.now()): boolean {
  if (typeof window !== 'undefined') {
    try {
      if (window.localStorage.getItem('volodka.ultra2048') !== '1') return false;
    } catch {
      return false;
    }
  } else {
    return false;
  }
  if (lastFpsFailMs != null && now - lastFpsFailMs < CLEAN_FOR_ULTRA_2048_MS) {
    return false;
  }
  return true;
}

/** Test helper */
export function __resetSoftWorkBudgetForTests(): void {
  lastFpsFailMs = null;
}

export function __markFpsFailForTests(now = performance.now()): void {
  lastFpsFailMs = now;
}
