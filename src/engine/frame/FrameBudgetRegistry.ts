import {
  CRITICAL_FRAME_SYSTEMS,
  FRAME_BUDGET_MS,
  FRAME_SYSTEM_ORDER,
  isFrameSystemCritical,
  normalizeFrameTickPhase,
  type FrameSystemId,
  type FrameTickCallback,
  type FrameTickContext,
  type FrameTickOptions,
  type FrameTickPhase,
  type RegisteredFrameTick,
} from './types';
import { isFrameSimulationActive } from './frameVisibility';

export type { RegisteredFrameTick };
export { CRITICAL_FRAME_SYSTEMS, FRAME_BUDGET_MS, isFrameSystemCritical };

let nextTickId = 1;
const ticks = new Map<number, RegisteredFrameTick>();

/** Last-frame CPU ms per system (written by FrameBudgetRunner). */
const systemCpuMs: Record<FrameSystemId, number> = {
  interaction: 0,
  player: 0,
  npc: 0,
  camera: 0,
  weather: 0,
  postfx: 0,
  misc: 0,
};

/** Last-frame CPU ms per registered tick id (stable key — label may change). */
const tickCpuMs = new Map<string, number>();

/** Hard cap — evict lowest-cpuMs entries when exceeded (dynamic labels / tick churn). */
const TICK_CPU_MS_MAX_SIZE = 128;

/** Finalized at end of runPostFrameBudget; getTopTickTimings reads this snapshot only. */
let lastCompletedTopTickTimings: Array<{
  label: string;
  system: FrameSystemId;
  cpuMs: number;
}> = [];

let lastTotalCpuMs = 0;
let lastPhysicsStepMs = 0;
let registeredTickCount = 0;
let frameBudgetStartMs = 0;
/** Non-critical pre-draw ticks soft-skipped last frame due to budget. */
let lastSkippedTickCount = 0;
/** Cumulative CPU across soft-skip phases within the current frame. */
let frameSoftSkipCumulativeMs = 0;
let softSkipOverBudget = false;

/** Prod dev-panel / e2e profiling — set by FrameProfilerBridge when mounted. */
let profileArmed = false;

export function setFrameBudgetProfilingArmed(armed: boolean): void {
  profileArmed = armed;
}

export function shouldTrackFrameTiming(): boolean {
  return (
    import.meta.env.DEV ||
    profileArmed ||
    (typeof window !== 'undefined' && window.__VOL_PROFILE__ === true)
  );
}

export function registerFrameTick(
  system: FrameSystemId,
  callback: FrameTickCallback,
  options: FrameTickOptions = {},
): number {
  const id = nextTickId++;
  ticks.set(id, {
    id,
    system,
    priority: options.priority ?? 0,
    label: options.label ?? `tick-${id}`,
    enabled: options.enabled ?? true,
    phase: normalizeFrameTickPhase(options.phase),
    critical: isFrameSystemCritical(system, options.critical),
    callback,
  });
  registeredTickCount = ticks.size;
  invalidateTickCache();
  return id;
}

export function unregisterFrameTick(id: number): void {
  ticks.delete(id);
  registeredTickCount = ticks.size;
  invalidateTickCache();
}

export function setFrameTickEnabled(id: number, enabled: boolean): void {
  const tick = ticks.get(id);
  if (tick) {
    tick.enabled = enabled;
    invalidateTickCache();
  }
}

export function getRegisteredTickCount(): number {
  return registeredTickCount;
}

export function getLastSkippedTickCount(): number {
  return lastSkippedTickCount;
}

export function setPhysicsStepMs(ms: number): void {
  lastPhysicsStepMs = ms;
}

export function getPhysicsStepMs(): number {
  return lastPhysicsStepMs;
}

export function getSystemCpuMs(system: FrameSystemId): number {
  return systemCpuMs[system];
}

export function getTotalBudgetCpuMs(): number {
  return lastTotalCpuMs;
}

function tickCpuKey(phase: FrameTickPhase, tick: RegisteredFrameTick): string {
  return `${phase}:${tick.system}:${tick.id}`;
}

function parseTickCpuKey(key: string): { phase: FrameTickPhase; system: FrameSystemId; tickId: number } {
  const sep1 = key.indexOf(':');
  const sep2 = sep1 >= 0 ? key.indexOf(':', sep1 + 1) : -1;
  const phase = (sep1 >= 0 ? key.slice(0, sep1) : 'pre_render') as FrameTickPhase;
  const system = (sep2 >= 0 ? key.slice(sep1 + 1, sep2) : 'misc') as FrameSystemId;
  const tickId = sep2 >= 0 ? Number.parseInt(key.slice(sep2 + 1), 10) : 0;
  return { phase, system, tickId };
}

function evictLowestTickCpuEntry(): void {
  let minKey: string | null = null;
  let minMs = Infinity;
  for (const [key, ms] of tickCpuMs) {
    if (ms < minMs) {
      minMs = ms;
      minKey = key;
    }
  }
  if (minKey !== null) {
    tickCpuMs.delete(minKey);
  }
}

function recordTickCpuMs(key: string, cpuMs: number): void {
  if (!tickCpuMs.has(key) && tickCpuMs.size >= TICK_CPU_MS_MAX_SIZE) {
    evictLowestTickCpuEntry();
  }
  tickCpuMs.set(key, cpuMs);
}

function formatTickLabel(phase: FrameTickPhase, label: string): string {
  return phase === 'post_render' ? `[post] ${label}` : label;
}

function collectTopTickTimings(limit: number): Array<{ label: string; system: FrameSystemId; cpuMs: number }> {
  return [...tickCpuMs.entries()]
    .map(([key, cpuMs]) => {
      const { phase, system, tickId } = parseTickCpuKey(key);
      const tick = ticks.get(tickId);
      const label = tick?.label ?? `tick-${tickId}`;
      return { label: formatTickLabel(phase, label), system, cpuMs };
    })
    .sort((a, b) => b.cpuMs - a.cpuMs)
    .slice(0, limit);
}

/** Last completed frame tick timings (snapshot taken after runPostFrameBudget). */
export function getTopTickTimings(limit = 8): Array<{ label: string; system: FrameSystemId; cpuMs: number }> {
  return lastCompletedTopTickTimings.slice(0, limit).map((entry) => ({ ...entry }));
}

/** Live timings for the in-progress frame (used while publishing profiler metrics). */
export function getCurrentFrameTopTickTimings(
  limit = 8,
): Array<{ label: string; system: FrameSystemId; cpuMs: number }> {
  return collectTopTickTimings(limit).map((entry) => ({ ...entry }));
}

function sortTicks(list: RegisteredFrameTick[]): void {
  list.sort((a, b) => {
    const systemDiff =
      FRAME_SYSTEM_ORDER.indexOf(a.system) - FRAME_SYSTEM_ORDER.indexOf(b.system);
    if (systemDiff !== 0) return systemDiff;
    if (a.priority !== b.priority) return a.priority - b.priority;
    return a.id - b.id;
  });
}

// Cached sorted tick buffers per phase — rebuilt only when ticks are
// registered/unregistered or enabled/disabled. Avoids O(N log N) sort
// on every frame (82 ticks × 3 phases = 246 sort ops/frame saved).
const sortedTickCache: Partial<Record<FrameTickPhase, RegisteredFrameTick[]>> = {};
let ticksCacheDirty = true;

function invalidateTickCache(): void {
  ticksCacheDirty = true;
  for (const key of Object.keys(sortedTickCache)) {
    delete sortedTickCache[key as FrameTickPhase];
  }
}

function getSortedTicksForPhase(phase: FrameTickPhase): RegisteredFrameTick[] {
  if (!ticksCacheDirty) {
    const cached = sortedTickCache[phase];
    if (cached) return cached;
  }
  // Rebuild all phases.
  for (const p of ['pre_physics', 'post_physics', 'pre_render', 'post_render'] as FrameTickPhase[]) {
    const buffer: RegisteredFrameTick[] = [];
    for (const tick of ticks.values()) {
      if (tick.enabled && tick.phase === p) {
        buffer.push(tick);
      }
    }
    sortTicks(buffer);
    sortedTickCache[p] = buffer;
  }
  ticksCacheDirty = false;
  return sortedTickCache[phase] ?? [];
}

function runTicks(
  ctx: FrameTickContext,
  phase: FrameTickPhase,
  trackSystemCpu: boolean,
  softSkip: boolean,
): void {
  if (!isFrameSimulationActive()) return;

  const buffer = getSortedTicksForPhase(phase);

  const trackTiming = shouldTrackFrameTiming();
  let skipped = 0;

  // Soft-skip without profiler: phase wall clock (1 sample after each tick)
  // instead of wrapping every callback in two performance.now() calls.
  const phaseStartMs = softSkip && !trackTiming ? performance.now() : 0;
  let phaseElapsedMs = 0;

  for (const tick of buffer) {
    if (softSkip && softSkipOverBudget && !tick.critical) {
      skipped += 1;
      if (trackTiming) {
        recordTickCpuMs(tickCpuKey(phase, tick), 0);
      }
      continue;
    }

    if (trackTiming) {
      const t0 = performance.now();
      tick.callback(ctx);
      const elapsed = performance.now() - t0;

      if (softSkip) {
        frameSoftSkipCumulativeMs += elapsed;
        if (frameSoftSkipCumulativeMs >= FRAME_BUDGET_MS) {
          softSkipOverBudget = true;
        }
      }

      if (trackSystemCpu) {
        systemCpuMs[tick.system] += elapsed;
      }
      recordTickCpuMs(tickCpuKey(phase, tick), elapsed);
    } else {
      tick.callback(ctx);
      if (softSkip) {
        phaseElapsedMs = performance.now() - phaseStartMs;
        if (frameSoftSkipCumulativeMs + phaseElapsedMs >= FRAME_BUDGET_MS) {
          softSkipOverBudget = true;
        }
      }
    }
  }

  if (softSkip && !trackTiming) {
    frameSoftSkipCumulativeMs += phaseElapsedMs;
  }

  if (softSkip) {
    lastSkippedTickCount += skipped;
  }
}

function beginFrameBudget(): void {
  for (const key of FRAME_SYSTEM_ORDER) {
    systemCpuMs[key] = 0;
  }
  // Always reset per-frame tick map before any runTicks call (all phases).
  tickCpuMs.clear();
  lastSkippedTickCount = 0;
  frameSoftSkipCumulativeMs = 0;
  softSkipOverBudget = false;
  frameBudgetStartMs = shouldTrackFrameTiming() ? performance.now() : 0;
}

function finalizePreRenderBudget(): void {
  if (shouldTrackFrameTiming()) {
    lastTotalCpuMs = performance.now() - frameBudgetStartMs;
  } else {
    lastTotalCpuMs = 0;
  }
}

/** Run one schedulable pipeline phase (pre_physics, post_physics, pre_render). */
export function runFrameBudgetForPhase(ctx: FrameTickContext, phase: FrameTickPhase): void {
  if (phase === 'pre_physics') {
    beginFrameBudget();
  }
  if (phase === 'post_render') {
    return;
  }
  runTicks(ctx, phase, true, true);
  if (phase === 'pre_render') {
    finalizePreRenderBudget();
  }
}

/** Runs all pre-draw phases (pre_physics → post_physics → pre_render) with soft-skip. */
export function runFrameBudget(ctx: FrameTickContext): void {
  beginFrameBudget();
  runTicks(ctx, 'pre_physics', true, true);
  runTicks(ctx, 'post_physics', true, true);
  runTicks(ctx, 'pre_render', true, true);
  finalizePreRenderBudget();
}

/** Run post_render ticks (profiler, canvas guards) after WebGL draw — never soft-skipped. */
export function runPostFrameBudget(ctx: FrameTickContext): void {
  runTicks(ctx, 'post_render', false, false);
  lastCompletedTopTickTimings = collectTopTickTimings(TICK_CPU_MS_MAX_SIZE);
}

/** Test-only: clear all registered ticks and timing state. */
export function resetFrameBudgetRegistryForTests(): void {
  ticks.clear();
  nextTickId = 1;
  registeredTickCount = 0;
  lastTotalCpuMs = 0;
  lastPhysicsStepMs = 0;
  lastSkippedTickCount = 0;
  frameSoftSkipCumulativeMs = 0;
  softSkipOverBudget = false;
  frameBudgetStartMs = 0;
  lastCompletedTopTickTimings = [];
  tickCpuMs.clear();
  for (const key of FRAME_SYSTEM_ORDER) {
    systemCpuMs[key] = 0;
  }
  invalidateTickCache();
}
