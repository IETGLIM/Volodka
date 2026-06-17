/**
 * Runtime adaptive quality — subscribes to budget violations and degrades preset
 * after sustained FPS failures (10s window), then re-arms upward after 30s clean budget.
 * Bound at engine boot via reviveGameEngine (kept as "bridge" to match gpuResourceBaselineBridge).
 */

import {
  degradeQualityPresetOneTier,
  upgradeQualityPresetOneTier,
} from '@/engine/graphics/adaptiveQualityDegrade';
import { subscribeRuntimeBudgetViolations } from '@/engine/performance/runtimeBudgetEvents';
import type { BudgetViolation } from '@/engine/performance/RuntimeBudgetMonitor';
import { registerHmrDispose } from '@/shared/dev/hmrDispose';
import { applyVisualSettings } from '@/engine/visualSettings';

/** Max one strike per second — ignores per-frame violation spam. */
const STRIKE_INTERVAL_MS = 1000;
/** Strikes required before degrading (10s sustained bad FPS). */
const STRIKES_REQUIRED = 10;
/** Clear strike counter after this long without FPS fail. */
const STRIKE_RESET_MS = 3000;
/** Upgrade one tier after this long without FPS fail since last failure. */
const CLEAN_BUDGET_MS = 30_000;
const CLEAN_CHECK_INTERVAL_MS = 1000;

let unsubViolations: (() => void) | null = null;
let cleanCheckInterval: ReturnType<typeof setInterval> | null = null;
let strikes = 0;
let lastStrikeMs = 0;
let lastFailMs: number | null = null;
let enabled = true;

function hasFpsFail(violations: BudgetViolation[]): boolean {
  return violations.some((v) => v.id === 'fps' && v.severity === 'fail');
}

function softenVisualSettingsOnDegrade(): void {
  try {
    localStorage.setItem('volodka_postfx', 'false');
    localStorage.setItem('volodka_particles', 'false');
    applyVisualSettings();
  } catch {
    /* ignore storage errors */
  }
}

function tryUpgradeAfterCleanBudget(now: number): void {
  if (!enabled || lastFailMs == null) return;
  if (now - lastFailMs < CLEAN_BUDGET_MS) return;

  lastFailMs = null;
  strikes = 0;
  lastStrikeMs = 0;
  upgradeQualityPresetOneTier();
}

function onRuntimeBudgetViolations(violations: BudgetViolation[]): void {
  if (!enabled) return;

  const now = performance.now();

  if (!hasFpsFail(violations)) {
    if (lastFailMs != null && now - lastFailMs > STRIKE_RESET_MS) {
      strikes = 0;
    }
    tryUpgradeAfterCleanBudget(now);
    return;
  }

  lastFailMs = now;

  if (lastStrikeMs > 0 && now - lastStrikeMs < STRIKE_INTERVAL_MS) return;
  lastStrikeMs = now;
  strikes += 1;

  if (strikes < STRIKES_REQUIRED) return;

  const next = degradeQualityPresetOneTier();
  if (next != null) {
    softenVisualSettingsOnDegrade();
  }
  strikes = 0;
}

export function setAdaptiveQualityBridgeEnabled(value: boolean): void {
  enabled = value;
  if (!value) {
    strikes = 0;
    lastStrikeMs = 0;
    lastFailMs = null;
  }
}

export function bindAdaptiveQualityBridge(): void {
  unsubViolations?.();
  if (cleanCheckInterval != null) {
    clearInterval(cleanCheckInterval);
    cleanCheckInterval = null;
  }
  strikes = 0;
  lastStrikeMs = 0;
  lastFailMs = null;
  enabled = true;
  unsubViolations = subscribeRuntimeBudgetViolations(onRuntimeBudgetViolations);
  cleanCheckInterval = setInterval(() => {
    tryUpgradeAfterCleanBudget(performance.now());
  }, CLEAN_CHECK_INTERVAL_MS);
}

export function unbindAdaptiveQualityBridge(): void {
  unsubViolations?.();
  unsubViolations = null;
  if (cleanCheckInterval != null) {
    clearInterval(cleanCheckInterval);
    cleanCheckInterval = null;
  }
  strikes = 0;
  lastStrikeMs = 0;
  lastFailMs = null;
}

/** Test hook — reset hysteresis without unsubscribing. */
export function resetAdaptiveQualityBridgeState(): void {
  strikes = 0;
  lastStrikeMs = 0;
  lastFailMs = null;
}

registerHmrDispose(unbindAdaptiveQualityBridge);
