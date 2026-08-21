/**
 * Runtime frame budget checks — FPS, draw calls, physics, React churn.
 */

import type { SceneId } from '@/config/sceneDefinitions';
import {
  PERFORMANCE_BUDGETS,
  getActiveFpsBudget,
  getDrawCallBudget,
  getDrawCallWarnThreshold,
  isWeakLaptopProfile,
} from '@/config/performanceBudgets';
import type { FrameProfilerSnapshot } from '@/engine/frame/FrameProfilerState';
import { emitRuntimeBudgetViolations } from '@/engine/performance/runtimeBudgetEvents';
import { devWarn } from '@/shared/utils/devLog';
import {
  getGpuResourceBudgetSnapshot,
  notifyGpuResourceSceneChange,
  type GpuResourceBudgetSnapshot,
} from '@/engine/performance/GpuResourceBudgetTracker';

export type BudgetSeverity = 'ok' | 'warn' | 'fail';

export interface BudgetViolation {
  id: string;
  severity: BudgetSeverity;
  message: string;
  value: number;
  limit: number;
}

export interface RuntimeBudgetSnapshot {
  fps: number;
  fpsProfile: 'desktop' | 'weakLaptop';
  sceneId: SceneId | null;
  violations: BudgetViolation[];
  firstScenePlayableMs: number | null;
  gpu: GpuResourceBudgetSnapshot | null;
}

const fpsSamples: number[] = [];
let lastEmitMs = 0;
const EMIT_INTERVAL_MS = 5000;

function pushFpsSample(frameMs: number): void {
  if (frameMs <= 0) return;
  fpsSamples.push(1000 / frameMs);
  const max = PERFORMANCE_BUDGETS.fps.sampleFrames;
  while (fpsSamples.length > max) fpsSamples.shift();
}

function averageFps(): number {
  if (fpsSamples.length === 0) return 0;
  return fpsSamples.reduce((a, b) => a + b, 0) / fpsSamples.length;
}

function evaluateGpuBudgetViolations(gpu: GpuResourceBudgetSnapshot): BudgetViolation[] {
  const violations: BudgetViolation[] = [];
  const memBudget = PERFORMANCE_BUDGETS.gpuMemoryEstimateMb;
  const countBudget = PERFORMANCE_BUDGETS.gpuResourceCounts;
  const totalMb = gpu.estimatedTotalBytes / (1024 * 1024);

  if (totalMb > memBudget.hardMax) {
    violations.push({
      id: 'gpuMemory',
      severity: 'fail',
      message: `GPU est. ${totalMb.toFixed(0)} MB > ${memBudget.hardMax} MB`,
      value: totalMb,
      limit: memBudget.hardMax,
    });
  } else if (totalMb > memBudget.target) {
    violations.push({
      id: 'gpuMemory',
      severity: 'warn',
      message: `GPU est. ${totalMb.toFixed(0)} MB > target ${memBudget.target} MB`,
      value: totalMb,
      limit: memBudget.target,
    });
  }

  if (gpu.rendererGeometryCount > countBudget.geometries.hardMax) {
    violations.push({
      id: 'gpuGeometries',
      severity: 'fail',
      message: `Geometries ${gpu.rendererGeometryCount} > ${countBudget.geometries.hardMax}`,
      value: gpu.rendererGeometryCount,
      limit: countBudget.geometries.hardMax,
    });
  } else if (gpu.rendererGeometryCount > countBudget.geometries.warn) {
    violations.push({
      id: 'gpuGeometries',
      severity: 'warn',
      message: `Geometries ${gpu.rendererGeometryCount} near limit ${countBudget.geometries.hardMax}`,
      value: gpu.rendererGeometryCount,
      limit: countBudget.geometries.warn,
    });
  }

  if (gpu.rendererTextureCount > countBudget.textures.hardMax) {
    violations.push({
      id: 'gpuTextures',
      severity: 'fail',
      message: `Textures ${gpu.rendererTextureCount} > ${countBudget.textures.hardMax}`,
      value: gpu.rendererTextureCount,
      limit: countBudget.textures.hardMax,
    });
  } else if (gpu.rendererTextureCount > countBudget.textures.warn) {
    violations.push({
      id: 'gpuTextures',
      severity: 'warn',
      message: `Textures ${gpu.rendererTextureCount} near limit ${countBudget.textures.hardMax}`,
      value: gpu.rendererTextureCount,
      limit: countBudget.textures.warn,
    });
  }

  const driftMb = gpu.driftBytes / (1024 * 1024);
  if (gpu.driftSeverity === 'fail' && gpu.consecutiveDriftViolations >= 2) {
    violations.push({
      id: 'gpuMemoryDrift',
      severity: 'fail',
      message: `GPU drift +${driftMb.toFixed(0)} MB vs scene baseline (leak?)`,
      value: driftMb,
      limit: memBudget.leakDriftFailMb,
    });
  } else if (gpu.driftSeverity !== 'ok' && gpu.consecutiveDriftViolations >= 2) {
    violations.push({
      id: 'gpuMemoryDrift',
      severity: 'warn',
      message: `GPU drift +${driftMb.toFixed(0)} MB vs scene baseline`,
      value: driftMb,
      limit: memBudget.leakDriftWarnMb,
    });
  }

  return violations;
}

export function evaluateRuntimeBudgets(
  profiler: FrameProfilerSnapshot,
  sceneId: SceneId | null,
): RuntimeBudgetSnapshot {
  pushFpsSample(profiler.cpuFrameMs);

  const fps = averageFps();
  const weak = isWeakLaptopProfile();
  const fpsBudget = getActiveFpsBudget();
  const violations: BudgetViolation[] = [];

  if (fpsSamples.length >= 30 && fps < fpsBudget.min) {
    violations.push({
      id: 'fps',
      severity: 'fail',
      message: `FPS ${fps.toFixed(0)} below min ${fpsBudget.min}`,
      value: fps,
      limit: fpsBudget.min,
    });
  } else if (fpsSamples.length >= 30 && fps < fpsBudget.target) {
    violations.push({
      id: 'fps',
      severity: 'warn',
      message: `FPS ${fps.toFixed(0)} below target ${fpsBudget.target}`,
      value: fps,
      limit: fpsBudget.target,
    });
  }

  if (profiler.cpuFrameMs > PERFORMANCE_BUDGETS.cpuFrameMs.hardMax) {
    violations.push({
      id: 'cpuFrame',
      severity: 'fail',
      message: `Frame ${profiler.cpuFrameMs.toFixed(1)} ms > ${PERFORMANCE_BUDGETS.cpuFrameMs.hardMax} ms`,
      value: profiler.cpuFrameMs,
      limit: PERFORMANCE_BUDGETS.cpuFrameMs.hardMax,
    });
  }

  if (profiler.physicsStepMs > PERFORMANCE_BUDGETS.physicsStepMs.hardMax) {
    violations.push({
      id: 'physics',
      severity: 'fail',
      message: `Physics ${profiler.physicsStepMs.toFixed(2)} ms > ${PERFORMANCE_BUDGETS.physicsStepMs.hardMax} ms`,
      value: profiler.physicsStepMs,
      limit: PERFORMANCE_BUDGETS.physicsStepMs.hardMax,
    });
  } else if (profiler.physicsStepMs > PERFORMANCE_BUDGETS.physicsStepMs.target) {
    violations.push({
      id: 'physics',
      severity: 'warn',
      message: `Physics ${profiler.physicsStepMs.toFixed(2)} ms > target ${PERFORMANCE_BUDGETS.physicsStepMs.target} ms`,
      value: profiler.physicsStepMs,
      limit: PERFORMANCE_BUDGETS.physicsStepMs.target,
    });
  }

  if (sceneId) {
    const drawMax = getDrawCallBudget(sceneId);
    const drawWarn = getDrawCallWarnThreshold(sceneId);
    if (profiler.drawCalls > drawMax) {
      violations.push({
        id: 'drawCalls',
        severity: 'fail',
        message: `Draw calls ${profiler.drawCalls} > ${drawMax} (${sceneId})`,
        value: profiler.drawCalls,
        limit: drawMax,
      });
    } else if (profiler.drawCalls > drawWarn) {
      violations.push({
        id: 'drawCalls',
        severity: 'warn',
        message: `Draw calls ${profiler.drawCalls} near limit ${drawMax} (${sceneId})`,
        value: profiler.drawCalls,
        limit: drawMax,
      });
    }
  }

  const reactLimit = PERFORMANCE_BUDGETS.reactRendersPerFrame;
  if (profiler.reactRendersThisFrame > reactLimit.hardMax) {
    violations.push({
      id: 'reactRenders',
      severity: 'fail',
      message: `React renders ${profiler.reactRendersThisFrame} > ${reactLimit.hardMax}/frame`,
      value: profiler.reactRendersThisFrame,
      limit: reactLimit.hardMax,
    });
  } else if (profiler.reactRendersThisFrame > reactLimit.warn) {
    violations.push({
      id: 'reactRenders',
      severity: 'warn',
      message: `React renders ${profiler.reactRendersThisFrame} > ${reactLimit.warn}/frame`,
      value: profiler.reactRendersThisFrame,
      limit: reactLimit.warn,
    });
  }

  const zustandLimit = PERFORMANCE_BUDGETS.zustandNotificationsPerFrame;
  if (profiler.zustandNotificationsThisFrame > zustandLimit.hardMax) {
    violations.push({
      id: 'zustand',
      severity: 'fail',
      message: `Zustand notifies ${profiler.zustandNotificationsThisFrame} > ${zustandLimit.hardMax}/frame`,
      value: profiler.zustandNotificationsThisFrame,
      limit: zustandLimit.hardMax,
    });
  } else if (profiler.zustandNotificationsThisFrame > zustandLimit.warn) {
    violations.push({
      id: 'zustand',
      severity: 'warn',
      message: `Zustand notifies ${profiler.zustandNotificationsThisFrame} > ${zustandLimit.warn}/frame`,
      value: profiler.zustandNotificationsThisFrame,
      limit: zustandLimit.warn,
    });
  }

  notifyGpuResourceSceneChange(sceneId);
  const gpu = getGpuResourceBudgetSnapshot();
  violations.push(...evaluateGpuBudgetViolations(gpu));

  return {
    fps,
    fpsProfile: weak ? 'weakLaptop' : 'desktop',
    sceneId,
    violations,
    firstScenePlayableMs: null,
    gpu,
  };
}

let lastSnapshot: RuntimeBudgetSnapshot | null = null;

export function getRuntimeBudgetSnapshot(): RuntimeBudgetSnapshot | null {
  return lastSnapshot;
}

export function publishRuntimeBudgetCheck(
  profiler: FrameProfilerSnapshot,
  sceneId: SceneId | null,
): RuntimeBudgetSnapshot {
  const snapshot = evaluateRuntimeBudgets(profiler, sceneId);
  lastSnapshot = snapshot;

  const now = performance.now();
  if (
    import.meta.env.DEV &&
    snapshot.violations.some((v) => v.severity === 'fail') &&
    now - lastEmitMs > EMIT_INTERVAL_MS
  ) {
    lastEmitMs = now;
    for (const v of snapshot.violations.filter((x) => x.severity === 'fail')) {
      devWarn(`[perf:budget] ${v.message}`);
    }
  }

  emitRuntimeBudgetViolations(snapshot.violations);

  return snapshot;
}
