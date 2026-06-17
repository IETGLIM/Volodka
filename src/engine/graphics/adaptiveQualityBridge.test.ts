import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  degradeQualityPresetOneTier,
  upgradeQualityPresetOneTier,
} from './adaptiveQualityDegrade';
import {
  bindAdaptiveQualityBridge,
  resetAdaptiveQualityBridgeState,
  unbindAdaptiveQualityBridge,
} from './adaptiveQualityBridge';
import { clearSessionAutoResolvedTier } from './autoQualitySession';
import { GRAPHICS_SETTINGS_KEY } from './qualityPresets';
import { emitRuntimeBudgetViolations } from '@/engine/performance/runtimeBudgetEvents';
import type { BudgetViolation } from '@/engine/performance/RuntimeBudgetMonitor';

vi.mock('./adaptiveQualityDegrade', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./adaptiveQualityDegrade')>();
  return {
    ...actual,
    degradeQualityPresetOneTier: vi.fn(actual.degradeQualityPresetOneTier),
    upgradeQualityPresetOneTier: vi.fn(actual.upgradeQualityPresetOneTier),
  };
});

function mockLocalStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => { store.set(key, value); },
    removeItem: (key: string) => { store.delete(key); },
    clear: () => { store.clear(); },
  };
}

function fpsFailViolation(): BudgetViolation[] {
  return [{ id: 'fps', severity: 'fail', message: 'FPS low', value: 20, limit: 30 }];
}

function fpsWarnViolation(): BudgetViolation[] {
  return [{ id: 'fps', severity: 'warn', message: 'FPS warn', value: 40, limit: 60 }];
}

describe('adaptiveQualityBridge', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('localStorage', mockLocalStorage());
    vi.stubGlobal('window', {
      innerWidth: 1920,
      devicePixelRatio: 2,
      dispatchEvent: vi.fn(),
    });
    clearSessionAutoResolvedTier();
    resetAdaptiveQualityBridgeState();
    bindAdaptiveQualityBridge();
    vi.mocked(degradeQualityPresetOneTier).mockClear();
    vi.mocked(upgradeQualityPresetOneTier).mockClear();
  });

  afterEach(() => {
    unbindAdaptiveQualityBridge();
    clearSessionAutoResolvedTier();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('degrades after 10s sustained fps failures', () => {
    for (let i = 0; i < 10; i += 1) {
      emitRuntimeBudgetViolations(fpsFailViolation());
      vi.advanceTimersByTime(1000);
    }
    expect(degradeQualityPresetOneTier).toHaveBeenCalledTimes(1);
  });

  it('does not degrade on a single fps failure spike', () => {
    emitRuntimeBudgetViolations(fpsFailViolation());
    vi.advanceTimersByTime(4000);
    emitRuntimeBudgetViolations(fpsWarnViolation());
    vi.advanceTimersByTime(4000);
    expect(degradeQualityPresetOneTier).not.toHaveBeenCalled();
  });

  it('upgrades one tier after 30s clean budget since last fps fail', () => {
    emitRuntimeBudgetViolations(fpsFailViolation());
    vi.advanceTimersByTime(30_000);
    emitRuntimeBudgetViolations(fpsWarnViolation());
    expect(upgradeQualityPresetOneTier).toHaveBeenCalledTimes(1);
  });

  it('calls degrade at min preset but cannot step lower', () => {
    localStorage.setItem(GRAPHICS_SETTINGS_KEY, 'low');
    for (let i = 0; i < 10; i += 1) {
      emitRuntimeBudgetViolations(fpsFailViolation());
      vi.advanceTimersByTime(1000);
    }
    expect(degradeQualityPresetOneTier).toHaveBeenCalledTimes(1);
    expect(vi.mocked(degradeQualityPresetOneTier).mock.results[0]?.value).toBeNull();
  });

  it('bind is idempotent', () => {
    bindAdaptiveQualityBridge();
    bindAdaptiveQualityBridge();
    for (let i = 0; i < 10; i += 1) {
      emitRuntimeBudgetViolations(fpsFailViolation());
      vi.advanceTimersByTime(1000);
    }
    expect(degradeQualityPresetOneTier).toHaveBeenCalledTimes(1);
  });
});
