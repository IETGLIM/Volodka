import {
  FRAME_SYSTEM_ORDER,
  type FrameSystemId,
  type FrameTickCallback,
  type FrameTickContext,
  type FrameTickOptions,
  type RegisteredFrameTick,
} from './types';

export type { RegisteredFrameTick };

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

/** Last-frame CPU ms per labeled tick (top offenders). */
const tickCpuMs = new Map<string, number>();

let lastTotalCpuMs = 0;
let lastPhysicsStepMs = 0;
let registeredTickCount = 0;

/** Reused each frame in runTicks — avoids [...ticks.values()] allocation. */
const tickRunBuffer: RegisteredFrameTick[] = [];

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
    phase: options.phase ?? 'pre',
    callback,
  });
  registeredTickCount = ticks.size;
  return id;
}

export function unregisterFrameTick(id: number): void {
  ticks.delete(id);
  registeredTickCount = ticks.size;
}

export function setFrameTickEnabled(id: number, enabled: boolean): void {
  const tick = ticks.get(id);
  if (tick) tick.enabled = enabled;
}

export function getRegisteredTickCount(): number {
  return registeredTickCount;
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

export function getTopTickTimings(limit = 8): Array<{ label: string; system: FrameSystemId; cpuMs: number }> {
  return [...tickCpuMs.entries()]
    .map(([key, cpuMs]) => {
      const normalized = key.startsWith('post:') ? key.slice(5) : key;
      const sep = normalized.indexOf(':');
      const system = (sep >= 0 ? normalized.slice(0, sep) : 'misc') as FrameSystemId;
      const label = sep >= 0 ? normalized.slice(sep + 1) : normalized;
      return { label: key.startsWith('post:') ? `[post] ${label}` : label, system, cpuMs };
    })
    .sort((a, b) => b.cpuMs - a.cpuMs)
    .slice(0, limit);
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

function runTicks(
  ctx: FrameTickContext,
  phase: RegisteredFrameTick['phase'],
  trackSystemCpu: boolean,
): void {
  tickRunBuffer.length = 0;
  for (const tick of ticks.values()) {
    if (tick.enabled && tick.phase === phase) {
      tickRunBuffer.push(tick);
    }
  }
  sortTicks(tickRunBuffer);

  for (const tick of tickRunBuffer) {
    const t0 = performance.now();
    tick.callback(ctx);
    const elapsed = performance.now() - t0;
    if (trackSystemCpu) {
      systemCpuMs[tick.system] += elapsed;
    }
    const keyPrefix = phase === 'post' ? 'post:' : '';
    tickCpuMs.set(`${keyPrefix}${tick.system}:${tick.label}`, elapsed);
  }
}

/** Run pre-render ticks in deterministic system + priority order. */
export function runFrameBudget(ctx: FrameTickContext): void {
  for (const key of FRAME_SYSTEM_ORDER) {
    systemCpuMs[key] = 0;
  }
  tickCpuMs.clear();

  const frameStart = performance.now();
  runTicks(ctx, 'pre', true);
  lastTotalCpuMs = performance.now() - frameStart;
}

/** Run post-render ticks (profiler, canvas guards) after WebGL draw. */
export function runPostFrameBudget(ctx: FrameTickContext): void {
  runTicks(ctx, 'post', false);
}
