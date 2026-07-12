/**
 * Cross-tree frame profiler snapshot.
 * Written by FrameProfilerBridge (inside Canvas), read by DevPanel (DOM).
 */

import type { FrameSystemId } from './types';
import {
  getPhysicsStepMs,
  getRegisteredTickCount,
  getSystemCpuMs,
  getCurrentFrameTopTickTimings,
  getTotalBudgetCpuMs,
} from './FrameBudgetRegistry';
import {
  getReactRendersThisFrame,
  getZustandNotificationsThisFrame,
} from './frameProfilerCounters';
import type { GpuResourceBudgetSnapshot } from '@/engine/performance/GpuResourceBudgetTracker';
import { getGpuResourceBudgetSnapshot } from '@/engine/performance/GpuResourceBudgetTracker';

/** @deprecated Use FrameProfilerSnapshot — kept for DevPanel backward compat. */
export interface RendererInfoSnapshot {
  drawCalls: number;
  triangles: number;
  textures: number;
  geometries: number;
  programs: number;
  dpr: number;
  timestamp: number;
}

export interface FrameSystemSnapshot {
  cpuMs: number;
  budgetPct: number;
}

export interface FrameProfilerSnapshot {
  frameNumber: number;
  timestamp: number;

  /** Total CPU time inside FrameBudgetRunner (all registered ticks). */
  cpuBudgetMs: number;
  /** Wall-clock frame delta from R3F (ms). */
  cpuFrameMs: number;
  /** Physics step estimate (ms) — set by PhysicsPlayer. */
  physicsStepMs: number;
  /** GPU frame time — requires EXT_disjoint_timer_query; null when unavailable. */
  gpuFrameMs: number | null;

  systems: Record<FrameSystemId, FrameSystemSnapshot>;
  topTicks: Array<{ label: string; system: FrameSystemId; cpuMs: number }>;
  registeredTicks: number;
  legacyUseFrameEstimate: number;

  drawCalls: number;
  triangles: number;
  textures: number;
  geometries: number;
  programs: number;
  dpr: number;

  reactRendersThisFrame: number;
  zustandNotificationsThisFrame: number;

  /** Estimated GPU memory budget snapshot (updated each frame via GpuResourceBudgetTracker). */
  gpuMemory: GpuResourceBudgetSnapshot | null;
}

const FRAME_BUDGET_MS = 1000 / 60;

let snapshot: FrameProfilerSnapshot = createEmptySnapshot();

function createEmptySnapshot(): FrameProfilerSnapshot {
  const emptySystem = (): FrameSystemSnapshot => ({ cpuMs: 0, budgetPct: 0 });
  return {
    frameNumber: 0,
    timestamp: 0,
    cpuBudgetMs: 0,
    cpuFrameMs: 0,
    physicsStepMs: 0,
    gpuFrameMs: null,
    systems: {
      interaction: emptySystem(),
      player: emptySystem(),
      npc: emptySystem(),
      camera: emptySystem(),
      weather: emptySystem(),
      postfx: emptySystem(),
      misc: emptySystem(),
    },
    topTicks: [],
    registeredTicks: 0,
    legacyUseFrameEstimate: 0,
    drawCalls: 0,
    triangles: 0,
    textures: 0,
    geometries: 0,
    programs: 0,
    dpr: 1,
    reactRendersThisFrame: 0,
    zustandNotificationsThisFrame: 0,
    gpuMemory: null,
  };
}

export function setFrameProfilerSnapshot(partial: Partial<FrameProfilerSnapshot>): void {
  snapshot = { ...snapshot, ...partial, timestamp: performance.now() };
}

export function getFrameProfilerSnapshot(): FrameProfilerSnapshot {
  return snapshot;
}

/** Build system breakdown from registry counters + GPU info. */
export function publishFrameProfiler(
  partial: Pick<
    FrameProfilerSnapshot,
    'cpuFrameMs' | 'drawCalls' | 'triangles' | 'textures' | 'geometries' | 'programs' | 'dpr' | 'frameNumber'
  >,
): void {
  const cpuBudgetMs = getTotalBudgetCpuMs();
  const systems = {} as Record<FrameSystemId, FrameSystemSnapshot>;
  const systemIds: FrameSystemId[] = [
    'interaction',
    'player',
    'npc',
    'camera',
    'weather',
    'postfx',
    'misc',
  ];
  for (const id of systemIds) {
    const cpuMs = getSystemCpuMs(id);
    systems[id] = {
      cpuMs,
      budgetPct: (cpuMs / FRAME_BUDGET_MS) * 100,
    };
  }

  setFrameProfilerSnapshot({
    ...partial,
    cpuBudgetMs,
    physicsStepMs: getPhysicsStepMs(),
    gpuFrameMs: null,
    systems,
    topTicks: getCurrentFrameTopTickTimings(8),
    registeredTicks: getRegisteredTickCount(),
    legacyUseFrameEstimate: Math.max(0, partial.cpuFrameMs - cpuBudgetMs),
    reactRendersThisFrame: getReactRendersThisFrame(),
    zustandNotificationsThisFrame: getZustandNotificationsThisFrame(),
    gpuMemory: getGpuResourceBudgetSnapshot(),
  });
}

/** @deprecated Use getFrameProfilerSnapshot() */
export function getRendererInfo(): RendererInfoSnapshot {
  const s = snapshot;
  return {
    drawCalls: s.drawCalls,
    triangles: s.triangles,
    textures: s.textures,
    geometries: s.geometries,
    programs: s.programs,
    dpr: s.dpr,
    timestamp: s.timestamp,
  };
}

/** @deprecated Use publishFrameProfiler() */
export function setRendererInfo(info: Partial<RendererInfoSnapshot>): void {
  setFrameProfilerSnapshot(info);
}
