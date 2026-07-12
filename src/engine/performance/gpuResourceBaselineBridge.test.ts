import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { eventBus } from '@/engine/EventBus';
import { PERFORMANCE_BUDGETS } from '@/config/performanceBudgets';
import {
  bindGpuResourceBaselineBridge,
  unbindGpuResourceBaselineBridge,
} from '@/engine/performance/gpuResourceBaselineBridge';
import {
  getGpuResourceBudgetSnapshot,
  notifyGpuResourceSceneChange,
  publishGpuRendererSnapshot,
  resetGpuResourceBudgetTracker,
} from '@/engine/performance/GpuResourceBudgetTracker';

describe('gpuResourceBaselineBridge', () => {
  beforeEach(() => {
    resetGpuResourceBudgetTracker();
    vi.useFakeTimers();
    bindGpuResourceBaselineBridge();
  });

  afterEach(() => {
    unbindGpuResourceBaselineBridge();
    vi.useRealTimers();
  });

  it('settles GPU baseline after scene:loaded and one sample window', () => {
    notifyGpuResourceSceneChange('volodka_room');
    publishGpuRendererSnapshot({
      geometryCount: 20,
      textureCount: 10,
      triangleCount: 50000,
    });
    const settledTarget = getGpuResourceBudgetSnapshot().estimatedTotalBytes;

    eventBus.emit('scene:loaded', { sceneId: 'volodka_room', fromSceneId: 'volodka_room' });
    vi.advanceTimersByTime(PERFORMANCE_BUDGETS.gpuMemoryEstimateMb.sampleIntervalMs);

    vi.advanceTimersByTime(PERFORMANCE_BUDGETS.gpuMemoryEstimateMb.sampleIntervalMs);
    publishGpuRendererSnapshot({
      geometryCount: 5,
      textureCount: 2,
      triangleCount: 500,
    });

    const afterDip = getGpuResourceBudgetSnapshot();
    expect(afterDip.baselineBytes).toBe(settledTarget);
    expect(afterDip.driftBytes).toBe(0);
  });

  it('reschedules settle when scene:loaded fires again before the timer', () => {
    notifyGpuResourceSceneChange('volodka_room');
    publishGpuRendererSnapshot({
      geometryCount: 10,
      textureCount: 4,
      triangleCount: 500,
    });
    vi.advanceTimersByTime(PERFORMANCE_BUDGETS.gpuMemoryEstimateMb.sampleIntervalMs);
    publishGpuRendererSnapshot({
      geometryCount: 10,
      textureCount: 4,
      triangleCount: 500,
    });

    eventBus.emit('scene:loaded', { sceneId: 'volodka_room', fromSceneId: 'volodka_room' });
    vi.advanceTimersByTime(PERFORMANCE_BUDGETS.gpuMemoryEstimateMb.sampleIntervalMs / 2);

    notifyGpuResourceSceneChange('home_evening');
    publishGpuRendererSnapshot({
      geometryCount: 30,
      textureCount: 12,
      triangleCount: 40000,
    });
    eventBus.emit('scene:loaded', { sceneId: 'home_evening', fromSceneId: 'volodka_room' });
    vi.advanceTimersByTime(PERFORMANCE_BUDGETS.gpuMemoryEstimateMb.sampleIntervalMs);

    const snapshot = getGpuResourceBudgetSnapshot();
    expect(snapshot.baselineBytes).toBe(snapshot.estimatedTotalBytes);
  });
});
