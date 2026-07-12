/**
 * Settles per-scene GPU memory baseline after scene:loaded + one sample window.
 * Bound at engine boot via reviveGameEngine — not an import-time side effect.
 */

import { eventBus } from '@/engine/EventBus';
import { PERFORMANCE_BUDGETS } from '@/config/performanceBudgets';
import { settleGpuResourceBaseline } from '@/engine/performance/GpuResourceBudgetTracker';
import { registerHmrDispose } from '@/shared/dev/hmrDispose';

let settleTimer: ReturnType<typeof setTimeout> | null = null;
let unsubSceneLoaded: (() => void) | null = null;

function clearSettleTimer(): void {
  if (settleTimer) {
    clearTimeout(settleTimer);
    settleTimer = null;
  }
}

function scheduleBaselineSettle(): void {
  clearSettleTimer();
  const delayMs = PERFORMANCE_BUDGETS.gpuMemoryEstimateMb.sampleIntervalMs;
  settleTimer = setTimeout(() => {
    settleTimer = null;
    settleGpuResourceBaseline();
  }, delayMs);
}

export function bindGpuResourceBaselineBridge(): void {
  unbindGpuResourceBaselineBridge();
  unsubSceneLoaded = eventBus.on('scene:loaded', scheduleBaselineSettle);
}

export function unbindGpuResourceBaselineBridge(): void {
  clearSettleTimer();
  unsubSceneLoaded?.();
  unsubSceneLoaded = null;
}

registerHmrDispose(unbindGpuResourceBaselineBridge);
