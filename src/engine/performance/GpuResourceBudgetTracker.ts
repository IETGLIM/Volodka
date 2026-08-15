/**
 * Global GPU resource budget tracker — estimated bytes, renderer counts, leak drift.
 */

import type { SceneId } from '@/config/sceneDefinitions';
import { PERFORMANCE_BUDGETS } from '@/config/performanceBudgets';
import {
  DEFAULT_TEXTURE_BYTES_ESTIMATE,
  estimateBufferGeometryBytes,
  estimateMaterialBytes,
  estimateSceneGeometryBytesFromTriangles,
} from '@/engine/three/gpuMemoryEstimate';
import { BufferGeometry, Material } from 'three';

export type GpuDriftSeverity = 'ok' | 'warn' | 'fail';

export interface GpuResourceBudgetSnapshot {
  timestamp: number;
  sceneId: SceneId | null;

  moduleGeometryBytes: number;
  moduleMaterialBytes: number;
  moduleGeometryCount: number;
  moduleMaterialCount: number;

  rendererGeometryCount: number;
  rendererTextureCount: number;
  rendererTriangleCount: number;

  /** Heuristic scene-attached GPU (triangles + untracked textures). */
  sceneEstimateBytes: number;
  estimatedTotalBytes: number;

  baselineBytes: number | null;
  driftBytes: number;
  driftSeverity: GpuDriftSeverity;
  consecutiveDriftViolations: number;
}

export interface GpuRendererSnapshot {
  geometryCount: number;
  textureCount: number;
  triangleCount: number;
}

const trackedGeometries = new Map<BufferGeometry, number>();
const trackedMaterials = new Map<Material, number>();

let rendererSnapshot: GpuRendererSnapshot = {
  geometryCount: 0,
  textureCount: 0,
  triangleCount: 0,
};

let sceneId: SceneId | null = null;
let baselineBytes: number | null = null;
let baselineSettled = false;
let consecutiveDriftViolations = 0;
let lastSampleMs = 0;
let lastSnapshot: GpuResourceBudgetSnapshot = createEmptySnapshot();

function createEmptySnapshot(): GpuResourceBudgetSnapshot {
  return {
    timestamp: 0,
    sceneId: null,
    moduleGeometryBytes: 0,
    moduleMaterialBytes: 0,
    moduleGeometryCount: 0,
    moduleMaterialCount: 0,
    rendererGeometryCount: 0,
    rendererTextureCount: 0,
    rendererTriangleCount: 0,
    sceneEstimateBytes: 0,
    estimatedTotalBytes: 0,
    baselineBytes: null,
    driftBytes: 0,
    driftSeverity: 'ok',
    consecutiveDriftViolations: 0,
  };
}

function sumMapValues(map: Map<unknown, number>): number {
  let total = 0;
  for (const value of map.values()) total += value;
  return total;
}

function computeEstimatedTotalBytes(): {
  moduleGeometryBytes: number;
  moduleMaterialBytes: number;
  sceneEstimateBytes: number;
  estimatedTotalBytes: number;
} {
  const moduleGeometryBytes = sumMapValues(trackedGeometries);
  const moduleMaterialBytes = sumMapValues(trackedMaterials);

  const geometryFromTriangles = estimateSceneGeometryBytesFromTriangles(
    rendererSnapshot.triangleCount,
  );
  const untrackedTextureCount = Math.max(
    0,
    rendererSnapshot.textureCount - trackedMaterials.size,
  );
  const sceneEstimateBytes =
    geometryFromTriangles + untrackedTextureCount * DEFAULT_TEXTURE_BYTES_ESTIMATE;

  const estimatedTotalBytes = Math.max(
    moduleGeometryBytes + moduleMaterialBytes,
    sceneEstimateBytes,
  );

  return {
    moduleGeometryBytes,
    moduleMaterialBytes,
    sceneEstimateBytes,
    estimatedTotalBytes,
  };
}

function evaluateDrift(
  estimatedTotalBytes: number,
  now: number,
): Pick<GpuResourceBudgetSnapshot, 'baselineBytes' | 'driftBytes' | 'driftSeverity' | 'consecutiveDriftViolations'> {
  const gpuBudget = PERFORMANCE_BUDGETS.gpuMemoryEstimateMb;
  const sampleIntervalMs = gpuBudget.sampleIntervalMs;
  const shouldSample = now - lastSampleMs >= sampleIntervalMs;

  if (shouldSample && !baselineSettled) {
    lastSampleMs = now;
    if (baselineBytes == null || estimatedTotalBytes < baselineBytes) {
      baselineBytes = estimatedTotalBytes;
      consecutiveDriftViolations = 0;
    } else {
      baselineBytes = Math.min(baselineBytes, estimatedTotalBytes);
    }
  } else if (shouldSample) {
    lastSampleMs = now;
  }

  const driftBytes = baselineBytes != null ? Math.max(0, estimatedTotalBytes - baselineBytes) : 0;
  const warnDriftBytes = gpuBudget.leakDriftWarnMb * 1024 * 1024;
  const failDriftBytes = gpuBudget.leakDriftFailMb * 1024 * 1024;

  let driftSeverity: GpuDriftSeverity = 'ok';
  if (driftBytes >= failDriftBytes) {
    driftSeverity = 'fail';
  } else if (driftBytes >= warnDriftBytes) {
    driftSeverity = 'warn';
  }

  if (shouldSample && driftSeverity !== 'ok') {
    consecutiveDriftViolations += 1;
  } else if (shouldSample) {
    consecutiveDriftViolations = 0;
  }

  return {
    baselineBytes,
    driftBytes,
    driftSeverity,
    consecutiveDriftViolations,
  };
}

function buildSnapshot(now: number): GpuResourceBudgetSnapshot {
  const totals = computeEstimatedTotalBytes();
  const drift = evaluateDrift(totals.estimatedTotalBytes, now);

  return {
    timestamp: now,
    sceneId,
    moduleGeometryBytes: totals.moduleGeometryBytes,
    moduleMaterialBytes: totals.moduleMaterialBytes,
    moduleGeometryCount: trackedGeometries.size,
    moduleMaterialCount: trackedMaterials.size,
    rendererGeometryCount: rendererSnapshot.geometryCount,
    rendererTextureCount: rendererSnapshot.textureCount,
    rendererTriangleCount: rendererSnapshot.triangleCount,
    sceneEstimateBytes: totals.sceneEstimateBytes,
    estimatedTotalBytes: totals.estimatedTotalBytes,
    ...drift,
  };
}

export function trackModuleGeometry(geometry: BufferGeometry): void {
  if (trackedGeometries.has(geometry)) return;
  trackedGeometries.set(geometry, estimateBufferGeometryBytes(geometry));
}

export function untrackModuleGeometry(geometry: BufferGeometry): void {
  trackedGeometries.delete(geometry);
}

export function trackModuleMaterial(material: Material): void {
  if (trackedMaterials.has(material)) return;
  trackedMaterials.set(material, estimateMaterialBytes(material));
}

export function untrackModuleMaterial(material: Material): void {
  trackedMaterials.delete(material);
}

export function publishGpuRendererSnapshot(partial: GpuRendererSnapshot): void {
  rendererSnapshot = partial;
  lastSnapshot = buildSnapshot(performance.now());
}

export function notifyGpuResourceSceneChange(nextSceneId: SceneId | null): void {
  if (sceneId === nextSceneId) return;
  sceneId = nextSceneId;
  baselineBytes = null;
  baselineSettled = false;
  consecutiveDriftViolations = 0;
  lastSampleMs = performance.now();
  lastSnapshot = buildSnapshot(performance.now());
}

/** Freeze baseline at the current post-load snapshot (idempotent). */
export function settleGpuResourceBaseline(): void {
  if (lastSnapshot.estimatedTotalBytes > 0) {
    baselineBytes = lastSnapshot.estimatedTotalBytes;
  }
  baselineSettled = true;
  consecutiveDriftViolations = 0;
  lastSnapshot = buildSnapshot(performance.now());
}

export function getGpuResourceBudgetSnapshot(): GpuResourceBudgetSnapshot {
  return lastSnapshot;
}

export function resetGpuResourceBudgetTracker(): void {
  trackedGeometries.clear();
  trackedMaterials.clear();
  rendererSnapshot = { geometryCount: 0, textureCount: 0, triangleCount: 0 };
  sceneId = null;
  baselineBytes = null;
  baselineSettled = false;
  consecutiveDriftViolations = 0;
  lastSampleMs = 0;
  lastSnapshot = createEmptySnapshot();
}
