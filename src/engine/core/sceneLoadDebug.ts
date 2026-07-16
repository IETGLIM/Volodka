/**
 * Lightweight, always-on diagnostic tap for scene-load + canvas-first-frame events.
 *
 * Why this exists: the scene-load pipeline (`sceneLoadedGate` ← `canvas:first-frame`
 * ← R3F post-frame tick) is a fragile multi-hop chain. When it breaks the player sees
 * «Не удалось загрузить сцену / canvas:first-frame watchdog timeout» and gameplay
 * stalls. This module records a rolling log of the relevant events on
 * `window.__volodkaDebug` so the flow can be inspected in production (Vercel) via a
 * console one-liner — without needing a local dev server.
 *
 * Cost: a handful of object allocations per scene transition. No per-frame work.
 */

import { eventBus } from '@/engine/EventBus';

const MAX_ENTRIES = 80;

type DebugEntry = {
  t: number;
  e: string;
  d?: unknown;
};

type VolodkaDebug = {
  log: DebugEntry[];
  sceneLoads: number;
  sceneFailures: number;
  firstFrames: number;
  degradedLoads: number;
  lastSceneLoad?: { sceneId: string; fromSceneId: string; degraded?: boolean };
  snapshot: () => string;
};

function ensureDebug(): VolodkaDebug {
  if (typeof window === 'undefined') return noopDebug;
  const existing = (window as unknown as { __volodkaDebug?: VolodkaDebug }).__volodkaDebug;
  if (existing) return existing;
  const log: DebugEntry[] = [];
  const dbg: VolodkaDebug = {
    log,
    sceneLoads: 0,
    sceneFailures: 0,
    firstFrames: 0,
    degradedLoads: 0,
    snapshot: () => JSON.stringify(dbg, null, 2),
  };
  (window as unknown as { __volodkaDebug?: VolodkaDebug }).__volodkaDebug = dbg;
  return dbg;
}

const noopDebug: VolodkaDebug = {
  log: [],
  sceneLoads: 0,
  sceneFailures: 0,
  firstFrames: 0,
  degradedLoads: 0,
  snapshot: () => '',
};

function record(event: string, data?: unknown): void {
  const dbg = ensureDebug();
  if (dbg === noopDebug) return;
  dbg.log.push({ t: Math.round(performance.now()), e: event, d: data });
  if (dbg.log.length > MAX_ENTRIES) dbg.log.shift();
}

let bound = false;

/** Install the diagnostic tap. Idempotent — safe to call multiple times. */
export function installSceneLoadDebugTap(): void {
  if (bound) return;
  bound = true;

  eventBus.on('scene:transition_start', (p) => {
    record('scene:transition_start', p);
  });
  eventBus.on('scene:enter', (p) => {
    record('scene:enter', p);
  });
  eventBus.on('canvas:invalidate-first-frame', (p) => {
    record('canvas:invalidate-first-frame', p);
  });
  eventBus.on('canvas:first-frame', (p) => {
    const dbg = ensureDebug();
    dbg.firstFrames += 1;
    record('canvas:first-frame', p);
  });
  eventBus.on('scene:loaded', (p) => {
    const dbg = ensureDebug();
    dbg.sceneLoads += 1;
    dbg.lastSceneLoad = { sceneId: p.sceneId, fromSceneId: p.fromSceneId, degraded: p.degraded };
    if (p.degraded) dbg.degradedLoads += 1;
    record('scene:loaded', p);
  });
  eventBus.on('scene:transition_failed', (p) => {
    const dbg = ensureDebug();
    dbg.sceneFailures += 1;
    record('scene:transition_failed', p);
  });
  eventBus.on('canvas:context-lost', () => {
    record('canvas:context-lost');
  });
  eventBus.on('canvas:context-restored', () => {
    record('canvas:context-restored');
  });

  record('sceneLoadDebugTap installed');
}
