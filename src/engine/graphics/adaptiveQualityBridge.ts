/**
 * Runtime adaptive quality — subscribes to budget violations and degrades preset
 * after sustained FPS failures (15s window), then re-arms upward after 30s clean budget.
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
/** Strikes required before degrading (15s sustained bad FPS — avoids degrading on transient spikes). */
const STRIKES_REQUIRED = 15;
/** Clear strike counter after this long without FPS fail. */
const STRIKE_RESET_MS = 5000;
/** Upgrade one tier after this long without FPS fail since last failure. */
const CLEAN_BUDGET_MS = 30_000;
const CLEAN_CHECK_INTERVAL_MS = 1000;
/** After a successful upgrade, wait this long before attempting another recovery step. */
const RECOVERY_COOLDOWN_MS = 20_000;

let unsubViolations: (() => void) | null = null;
let cleanCheckInterval: ReturnType<typeof setInterval> | null = null;
let strikes = 0;
let lastStrikeMs = 0;
let lastFailMs: number | null = null;
/** Timestamp of the last successful upgrade, used to pace multi-step recovery. */
let lastUpgradeMs: number | null = null;
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
  // Pace multi-step recovery: don't upgrade again too soon after a previous upgrade
  if (lastUpgradeMs != null && now - lastUpgradeMs < RECOVERY_COOLDOWN_MS) return;

  const result = upgradeQualityPresetOneTier();
  if (result != null) {
    // Successful upgrade — record time so we can pace the next recovery step.
    // Keep lastFailMs set so we can continue recovering if quality was
    // degraded multiple tiers and the budget stays clean.
    // Also restore PostFX and particles that were disabled on degrade.
    try {
      localStorage.setItem('volodka_postfx', 'true');
      localStorage.setItem('volodka_particles', 'true');
      applyVisualSettings();
    } catch {
      /* ignore storage errors */
    }
    lastUpgradeMs = now;
  } else {
    // Already at max tier — no more recovery needed.
    lastFailMs = null;
  }
  strikes = 0;
  lastStrikeMs = 0;
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
    lastUpgradeMs = null;
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
  lastUpgradeMs = null;
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
  lastUpgradeMs = null;
}

/** Test hook — reset hysteresis without unsubscribing. */
export function resetAdaptiveQualityBridgeState(): void {
  strikes = 0;
  lastStrikeMs = 0;
  lastFailMs = null;
  lastUpgradeMs = null;
}

registerHmrDispose(unbindAdaptiveQualityBridge);
