/**
 * Runtime adaptive quality — subscribes to budget violations and degrades preset
 * after sustained failures, then re-arms upward after 30s clean budget.
 * Bound at engine boot via reviveGameEngine (kept as "bridge" to match gpuResourceBaselineBridge).
 *
 * [roadmap:GFX-02] Previously reacted ONLY to FPS 'fail' violations. Memory
 * pressure (gpuMemory, gpuMemoryDrift) was emitted by RuntimeBudgetMonitor but
 * ignored — a memory leak could grow to tab crash without triggering any degrade.
 * Now tracks FPS strikes and memory strikes separately:
 * - FPS: 10 strikes (10s sustained) → degrade one tier (existing behavior)
 * - Memory: 3 strikes (3s sustained) → degrade one tier (NEW — faster, because
 *   memory leaks are catastrophic and GPU cleanup on tier change can reclaim)
 * Memory violations also bypass the strike interval (every violation counts)
 * because they fire less frequently than FPS violations.
 */

import {
  degradeQualityPresetOneTier,
  upgradeQualityPresetOneTier,
} from '@/engine/graphics/adaptiveQualityDegrade';
import { subscribeRuntimeBudgetViolations } from '@/engine/performance/runtimeBudgetEvents';
import type { BudgetViolation } from '@/engine/performance/RuntimeBudgetMonitor';
import { registerHmrDispose } from '@/shared/dev/hmrDispose';
import { applyVisualSettings } from '@/engine/visualSettings';
import {
  dispatchQualityGfxPressureChanged,
  type GfxPressureLevel,
} from '@/engine/graphics/graphicsSettingsStorage';

/** Max one strike per second — ignores per-frame violation spam. */
const STRIKE_INTERVAL_MS = 1000;
/** Strikes required before degrading on FPS fail (10s sustained bad FPS). */
const FPS_STRIKES_REQUIRED = 10;
/**
 * Strikes required before degrading on memory fail (3s sustained memory pressure).
 * Lower than FPS because memory leaks are catastrophic (tab crash) and GPU
 * cleanup on tier change can reclaim leaked resources.
 */
const MEMORY_STRIKES_REQUIRED = 3;
/** Clear strike counter after this long without any fail. */
const STRIKE_RESET_MS = 3000;
/** Upgrade one tier after this long without any fail since last failure. */
const CLEAN_BUDGET_MS = 30_000;
const CLEAN_CHECK_INTERVAL_MS = 1000;

let unsubViolations: (() => void) | null = null;
let cleanCheckInterval: ReturnType<typeof setInterval> | null = null;
let fpsStrikes = 0;
let memoryStrikes = 0;
let lastFpsStrikeMs = 0;
let lastFailMs: number | null = null;
let enabled = true;

/**
 * [roadmap:GFX-03] Current GPU memory pressure level.
 * - 'none': no memory violations
 * - 'memory': gpuMemory/gpuGeometries/gpuTextures 'fail' (budget exceeded)
 * - 'critical': gpuMemoryDrift 'fail' (active leak detected) — most severe
 * Drives `applyGfxPressureToPreset` in `resolveQualityPreset` via the
 * QUALITY_GFX_PRESSURE_CHANGED window event → useGraphicsQuality listener.
 */
let currentGfxPressure: GfxPressureLevel = 'none';

/** Derive pressure level from current violations. */
function deriveGfxPressure(violations: BudgetViolation[]): GfxPressureLevel {
  const hasDriftLeak = violations.some(
    (v) => v.id === 'gpuMemoryDrift' && v.severity === 'fail',
  );
  if (hasDriftLeak) return 'critical';
  const hasMemoryFail = violations.some(
    (v) =>
      (v.id === 'gpuMemory' || v.id === 'gpuGeometries' || v.id === 'gpuTextures') &&
      v.severity === 'fail',
  );
  if (hasMemoryFail) return 'memory';
  return 'none';
}

/** Update pressure level and notify listeners if changed. */
function updateGfxPressure(violations: BudgetViolation[]): void {
  const next = deriveGfxPressure(violations);
  if (next === currentGfxPressure) return;
  currentGfxPressure = next;
  dispatchQualityGfxPressureChanged(next);
  if (import.meta.env.DEV) {
    console.warn(`[adaptiveQualityBridge] GPU pressure: ${currentGfxPressure}`);
  }
}

/** Test hook — read current pressure level. */
export function getGfxPressure(): GfxPressureLevel {
  return currentGfxPressure;
}

/** FPS 'fail' violations — sustained poor framerate. */
function hasFpsFail(violations: BudgetViolation[]): boolean {
  return violations.some((v) => v.id === 'fps' && v.severity === 'fail');
}

/**
 * Memory 'fail' violations — gpuMemory (absolute budget exceeded),
 * gpuMemoryDrift (leak detected), gpuGeometries, gpuTextures.
 * These are catastrophic — tab crash risk — so we react faster.
 */
function hasMemoryFail(violations: BudgetViolation[]): boolean {
  return violations.some(
    (v) =>
      (v.id === 'gpuMemory' ||
        v.id === 'gpuMemoryDrift' ||
        v.id === 'gpuGeometries' ||
        v.id === 'gpuTextures') &&
      v.severity === 'fail',
  );
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
  fpsStrikes = 0;
  memoryStrikes = 0;
  lastFpsStrikeMs = 0;
  upgradeQualityPresetOneTier();
}

function onRuntimeBudgetViolations(violations: BudgetViolation[]): void {
  if (!enabled) return;

  const now = performance.now();
  const fpsFail = hasFpsFail(violations);
  const memFail = hasMemoryFail(violations);

  // [roadmap:GFX-03] Update GPU pressure level (drives applyGfxPressureToPreset).
  updateGfxPressure(violations);

  if (!fpsFail && !memFail) {
    if (lastFailMs != null && now - lastFailMs > STRIKE_RESET_MS) {
      fpsStrikes = 0;
      memoryStrikes = 0;
    }
    tryUpgradeAfterCleanBudget(now);
    return;
  }

  lastFailMs = now;

  // FPS strikes: rate-limited (1 per second), need 10 to degrade.
  if (fpsFail) {
    if (lastFpsStrikeMs === 0 || now - lastFpsStrikeMs >= STRIKE_INTERVAL_MS) {
      lastFpsStrikeMs = now;
      fpsStrikes += 1;
    }
  }

  // Memory strikes: NOT rate-limited (memory violations fire less often),
  // need only 3 to degrade (catastrophic risk → faster reaction).
  if (memFail) {
    memoryStrikes += 1;
    if (import.meta.env.DEV && memoryStrikes === 1) {
      const kinds = violations
        .filter((v) => v.severity === 'fail' && v.id !== 'fps')
        .map((v) => v.id)
        .join(', ');
      console.warn(
        `[adaptiveQualityBridge] Memory pressure detected (${kinds}). ` +
          `Strike ${memoryStrikes}/${MEMORY_STRIKES_REQUIRED} — will degrade at ${MEMORY_STRIKES_REQUIRED}.`,
      );
    }
  }

  const shouldDegradeForFps = fpsStrikes >= FPS_STRIKES_REQUIRED;
  const shouldDegradeForMemory = memoryStrikes >= MEMORY_STRIKES_REQUIRED;

  if (!shouldDegradeForFps && !shouldDegradeForMemory) return;

  const next = degradeQualityPresetOneTier();
  if (next != null) {
    softenVisualSettingsOnDegrade();
  }
  // Reset the strike counter that triggered the degrade.
  if (shouldDegradeForFps) fpsStrikes = 0;
  if (shouldDegradeForMemory) memoryStrikes = 0;
}

export function setAdaptiveQualityBridgeEnabled(value: boolean): void {
  enabled = value;
  if (!value) {
    fpsStrikes = 0;
    memoryStrikes = 0;
    lastFpsStrikeMs = 0;
    lastFailMs = null;
  }
}

export function bindAdaptiveQualityBridge(): void {
  unsubViolations?.();
  if (cleanCheckInterval != null) {
    clearInterval(cleanCheckInterval);
    cleanCheckInterval = null;
  }
  fpsStrikes = 0;
  memoryStrikes = 0;
  lastFpsStrikeMs = 0;
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
  fpsStrikes = 0;
  memoryStrikes = 0;
  lastFpsStrikeMs = 0;
  lastFailMs = null;
}

/** Test hook — reset hysteresis without unsubscribing. */
export function resetAdaptiveQualityBridgeState(): void {
  fpsStrikes = 0;
  memoryStrikes = 0;
  lastFpsStrikeMs = 0;
  lastFailMs = null;
}

registerHmrDispose(unbindAdaptiveQualityBridge);
