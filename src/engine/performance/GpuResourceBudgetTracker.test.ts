import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import * as THREE from 'three';
import {
  estimateBufferGeometryBytes,
  estimateSceneGeometryBytesFromTriangles,
  estimateTextureBytes,
} from '@/engine/three/gpuMemoryEstimate';
import {
  getGpuResourceBudgetSnapshot,
  notifyGpuResourceSceneChange,
  publishGpuRendererSnapshot,
  resetGpuResourceBudgetTracker,
  settleGpuResourceBaseline,
  trackModuleGeometry,
} from '@/engine/performance/GpuResourceBudgetTracker';
import { PERFORMANCE_BUDGETS } from '@/config/performanceBudgets';

describe('gpuMemoryEstimate', () => {
  it('estimateBufferGeometryBytes sums attribute and index buffers', () => {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const bytes = estimateBufferGeometryBytes(geometry);
    expect(bytes).toBeGreaterThan(0);
    geometry.dispose();
  });

  it('estimateTextureBytes scales with dimensions and mipmaps', () => {
    const texture = new THREE.Texture({ width: 256, height: 256 } as HTMLImageElement);
    texture.format = THREE.RGBAFormat;
    texture.type = THREE.UnsignedByteType;
    texture.generateMipmaps = true;
    const bytes = estimateTextureBytes(texture);
    expect(bytes).toBeGreaterThan(256 * 256 * 4);
    texture.dispose();
  });

  it('estimateSceneGeometryBytesFromTriangles grows with mesh complexity', () => {
    expect(estimateSceneGeometryBytesFromTriangles(100)).toBeGreaterThan(
      estimateSceneGeometryBytesFromTriangles(10),
    );
  });
});

describe('GpuResourceBudgetTracker', () => {
  beforeEach(() => {
    resetGpuResourceBudgetTracker();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('tracks module geometry bytes and renderer snapshot totals', () => {
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    trackModuleGeometry(geometry);

    publishGpuRendererSnapshot({
      geometryCount: 5,
      textureCount: 3,
      triangleCount: 1200,
    });

    const snapshot = getGpuResourceBudgetSnapshot();
    expect(snapshot.moduleGeometryCount).toBe(1);
    expect(snapshot.moduleGeometryBytes).toBeGreaterThan(0);
    expect(snapshot.estimatedTotalBytes).toBeGreaterThan(snapshot.moduleGeometryBytes);
    expect(snapshot.rendererTriangleCount).toBe(1200);

    geometry.dispose();
  });

  it('resets baseline on scene change and detects drift growth', () => {
    notifyGpuResourceSceneChange('volodka_room');

    publishGpuRendererSnapshot({
      geometryCount: 10,
      textureCount: 4,
      triangleCount: 500,
    });
    const initial = getGpuResourceBudgetSnapshot().estimatedTotalBytes;

    vi.advanceTimersByTime(5000);
    publishGpuRendererSnapshot({
      geometryCount: 10,
      textureCount: 4,
      triangleCount: 500,
    });
    expect(getGpuResourceBudgetSnapshot().baselineBytes).toBe(initial);

    vi.advanceTimersByTime(5000);
    publishGpuRendererSnapshot({
      geometryCount: 40,
      textureCount: 30,
      triangleCount: 50000,
    });

    const drift = getGpuResourceBudgetSnapshot();
    expect(drift.driftBytes).toBeGreaterThan(0);
    expect(drift.driftSeverity).not.toBe('ok');

    notifyGpuResourceSceneChange('home_evening');
    expect(getGpuResourceBudgetSnapshot().baselineBytes).toBeNull();
  });

  it('ratchets baseline down on transient dips while calibrating (unsettled)', () => {
    notifyGpuResourceSceneChange('volodka_room');

    publishGpuRendererSnapshot({
      geometryCount: 20,
      textureCount: 10,
      triangleCount: 50000,
    });
    vi.advanceTimersByTime(PERFORMANCE_BUDGETS.gpuMemoryEstimateMb.sampleIntervalMs);
    publishGpuRendererSnapshot({
      geometryCount: 20,
      textureCount: 10,
      triangleCount: 50000,
    });
    const highBaseline = getGpuResourceBudgetSnapshot().baselineBytes;
    expect(highBaseline).toBeGreaterThan(0);

    vi.advanceTimersByTime(PERFORMANCE_BUDGETS.gpuMemoryEstimateMb.sampleIntervalMs);
    publishGpuRendererSnapshot({
      geometryCount: 5,
      textureCount: 2,
      triangleCount: 500,
    });

    const dipped = getGpuResourceBudgetSnapshot();
    expect(dipped.baselineBytes).toBeLessThan(highBaseline!);
    expect(dipped.driftBytes).toBe(0);
  });

  it('keeps settled baseline when a later sample dips transiently', () => {
    notifyGpuResourceSceneChange('volodka_room');

    publishGpuRendererSnapshot({
      geometryCount: 20,
      textureCount: 10,
      triangleCount: 50000,
    });
    vi.advanceTimersByTime(PERFORMANCE_BUDGETS.gpuMemoryEstimateMb.sampleIntervalMs);
    publishGpuRendererSnapshot({
      geometryCount: 20,
      textureCount: 10,
      triangleCount: 50000,
    });
    settleGpuResourceBaseline();
    const settledBaseline = getGpuResourceBudgetSnapshot().baselineBytes;
    expect(settledBaseline).toBeGreaterThan(0);

    vi.advanceTimersByTime(PERFORMANCE_BUDGETS.gpuMemoryEstimateMb.sampleIntervalMs);
    publishGpuRendererSnapshot({
      geometryCount: 5,
      textureCount: 2,
      triangleCount: 500,
    });

    const afterDip = getGpuResourceBudgetSnapshot();
    expect(afterDip.baselineBytes).toBe(settledBaseline);
    expect(afterDip.driftBytes).toBe(0);
  });

  it('detects drift growth above settled baseline', () => {
    notifyGpuResourceSceneChange('volodka_room');

    publishGpuRendererSnapshot({
      geometryCount: 10,
      textureCount: 4,
      triangleCount: 500,
    });
    settleGpuResourceBaseline();

    vi.advanceTimersByTime(PERFORMANCE_BUDGETS.gpuMemoryEstimateMb.sampleIntervalMs);
    publishGpuRendererSnapshot({
      geometryCount: 40,
      textureCount: 30,
      triangleCount: 50000,
    });

    const drift = getGpuResourceBudgetSnapshot();
    expect(drift.driftBytes).toBeGreaterThan(0);
    expect(drift.driftSeverity).not.toBe('ok');
  });
});
