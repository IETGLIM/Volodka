/**
 * Single sequential poem-reveal orchestrator.
 * Modes share one presentation shell; jobs never stack — FIFO queue.
 */

import { eventBus } from '@/engine/EventBus';
import { getPoemById } from '@/data/gameDataLoader';
import {
  notifyPoemReadingInterstitialChanged,
  setPoemRevealInterstitialActive,
} from '@/engine/presentation/cinematicInterstitialPresentation';
import type { PoemRevealJob, PoemRevealMode } from './poemRevealTypes';

const queue: PoemRevealJob[] = [];
let active: PoemRevealJob | null = null;
/** Mounted UI poem id (may lag active while story overlay hides host). */
let uiActivePoemId: string | null = null;

const sessionDiscoverySeen = new Set<string>();
const sessionRitualSeen = new Set<string>();

function syncInterstitialFlag(): void {
  setPoemRevealInterstitialActive(active !== null || uiActivePoemId !== null);
  notifyPoemReadingInterstitialChanged();
}

function emitShow(job: PoemRevealJob): void {
  eventBus.emit('poem:show_reveal', { poemId: job.poemId, mode: job.mode });
  // Legacy event aliases — audio / older listeners.
  if (job.mode === 'discovery') {
    eventBus.emit('poem:show_discovery_reveal', { poemId: job.poemId });
  } else if (job.mode === 'power_ritual') {
    eventBus.emit('poem:show_cutscene', { poemId: job.poemId });
  }
}

function emitEnd(job: PoemRevealJob | null): void {
  eventBus.emit('poem:reveal_end', {
    poemId: job?.poemId,
    mode: job?.mode,
  });
  if (!job || job.mode === 'discovery') {
    eventBus.emit('poem:discovery_reveal_end', { poemId: job?.poemId });
  }
  if (!job || job.mode === 'power_ritual') {
    eventBus.emit('poem:cutscene_end', {});
    eventBus.emit('camera:poem_reading_end', {});
  }
}

function startNext(): void {
  const next = queue.shift() ?? null;
  active = next;
  if (next) {
    emitShow(next);
  }
  syncInterstitialFlag();
}

function enqueue(job: PoemRevealJob): 'started' | 'queued' {
  const duplicate =
    (active?.poemId === job.poemId && active.mode === job.mode) ||
    queue.some((q) => q.poemId === job.poemId && q.mode === job.mode);
  if (duplicate) return active ? 'queued' : 'started';

  if (active) {
    queue.push(job);
    syncInterstitialFlag();
    return 'queued';
  }

  active = job;
  emitShow(job);
  syncInterstitialFlag();
  return 'started';
}

export function resetPoemRevealSession(): void {
  queue.length = 0;
  active = null;
  uiActivePoemId = null;
  sessionDiscoverySeen.clear();
  sessionRitualSeen.clear();
  syncInterstitialFlag();
}

export function getActivePoemReveal(): PoemRevealJob | null {
  return active;
}

export function getPendingPoemRevealQueue(): readonly PoemRevealJob[] {
  return queue;
}

export function isPoemRevealBusy(): boolean {
  return active !== null || uiActivePoemId !== null || queue.length > 0;
}

export function isPoemRevealUiActive(): boolean {
  return uiActivePoemId !== null;
}

export function setPoemRevealUiActive(poemId: string | null): void {
  if (uiActivePoemId === poemId) return;
  uiActivePoemId = poemId;
  syncInterstitialFlag();
}

export function hasSeenPoemDiscoveryThisSession(poemId: string): boolean {
  return sessionDiscoverySeen.has(poemId);
}

export function hasSeenPoemRitualThisSession(poemId: string): boolean {
  return sessionRitualSeen.has(poemId);
}

export function markPoemRitualSeen(poemId: string): void {
  sessionRitualSeen.add(poemId);
}

function isJobPending(poemId: string, mode: PoemRevealMode): boolean {
  if (active?.poemId === poemId && active.mode === mode) return true;
  return queue.some((q) => q.poemId === poemId && q.mode === mode);
}

/**
 * Queue or start a reveal. Discovery is session-once; unknown poems no-op.
 * Returns false when the request is rejected (already seen / unknown / duplicate).
 */
export function requestPoemReveal(poemId: string, mode: PoemRevealMode): boolean {
  if (!poemId || !getPoemById(poemId)) return false;

  if (mode === 'discovery') {
    if (sessionDiscoverySeen.has(poemId)) return false;
    if (isJobPending(poemId, 'discovery')) return false;
  } else if (isJobPending(poemId, mode)) {
    return false;
  }

  enqueue({ poemId, mode });
  return true;
}

/** Complete the active reveal and drain the queue. */
export function completePoemReveal(poemId: string): PoemRevealJob | null {
  if (!active || active.poemId !== poemId) {
    // UI may finish after cancel — still clear UI flag.
    if (uiActivePoemId === poemId) {
      uiActivePoemId = null;
      syncInterstitialFlag();
    }
    return null;
  }

  const finished = active;
  if (finished.mode === 'discovery') {
    sessionDiscoverySeen.add(poemId);
  } else if (finished.mode === 'power_ritual') {
    sessionRitualSeen.add(poemId);
  }

  active = null;
  uiActivePoemId = null;
  emitEnd(finished);
  startNext();
  return finished;
}

/** Alias used by reading orchestrator cancel paths. */
export function cancelAllPoemReveals(): void {
  cancelPoemReveal();
}

/** Cancel active + drain queue without marking session seen. */
export function cancelPoemReveal(): void {
  if (!active && queue.length === 0 && !uiActivePoemId) return;

  const cancelled = active;
  queue.length = 0;
  active = null;
  uiActivePoemId = null;
  emitEnd(cancelled);
  syncInterstitialFlag();
}

/** Cancel only power_ritual jobs (scene/combat interrupt for reading). */
export function cancelPoemRevealMode(mode: PoemRevealMode): void {
  for (let i = queue.length - 1; i >= 0; i--) {
    if (queue[i]?.mode === mode) queue.splice(i, 1);
  }

  if (active?.mode === mode) {
    const cancelled = active;
    active = null;
    uiActivePoemId = null;
    emitEnd(cancelled);
    startNext();
    return;
  }

  syncInterstitialFlag();
}

// ─── Compatibility aliases (discovery / reading entry points) ───

export function getPendingPoemDiscoveryId(): string | null {
  if (active?.mode === 'discovery') return active.poemId;
  const queued = queue.find((j) => j.mode === 'discovery');
  return queued?.poemId ?? null;
}

export function isPoemDiscoveryRevealBusy(): boolean {
  return isPoemRevealBusy();
}

export function isPoemDiscoveryRevealUiActive(): boolean {
  return uiActivePoemId !== null && active?.mode === 'discovery';
}

export function requestPoemDiscoveryReveal(poemId: string): boolean {
  return requestPoemReveal(poemId, 'discovery');
}

export function completePoemDiscoveryReveal(poemId: string): void {
  completePoemReveal(poemId);
}

export function cancelPoemDiscoveryReveal(): void {
  cancelPoemRevealMode('discovery');
  // If discovery was active we drained; also clear orphan UI.
  if (!active && queue.length === 0) {
    uiActivePoemId = null;
    syncInterstitialFlag();
  }
}

export function setPoemDiscoveryRevealUiActive(poemId: string | null): void {
  setPoemRevealUiActive(poemId);
}

export function resetPoemDiscoveryRevealSession(): void {
  // Only clear discovery session marks + discovery jobs — keep ritual state.
  for (let i = queue.length - 1; i >= 0; i--) {
    if (queue[i]?.mode === 'discovery') queue.splice(i, 1);
  }
  sessionDiscoverySeen.clear();
  if (active?.mode === 'discovery') {
    const cancelled = active;
    active = null;
    uiActivePoemId = null;
    emitEnd(cancelled);
    startNext();
  } else {
    syncInterstitialFlag();
  }
}

let unsubLifecycle: (() => void) | null = null;

export function bindPoemRevealLifecycleListeners(): void {
  unbindPoemRevealLifecycleListeners();
  const unsubs = [
    eventBus.on('poem:collected', ({ poemId }) => {
      requestPoemReveal(poemId, 'discovery');
    }),
    eventBus.on('scene:transition_start', () => {
      cancelPoemReveal();
    }),
    eventBus.on('combat:start', () => {
      cancelPoemReveal();
    }),
  ];
  unsubLifecycle = () => {
    for (const unsub of unsubs) unsub();
  };
}

export function unbindPoemRevealLifecycleListeners(): void {
  unsubLifecycle?.();
  unsubLifecycle = null;
}

/** @deprecated Use bindPoemRevealLifecycleListeners */
export function bindPoemDiscoveryRevealLifecycleListeners(): void {
  bindPoemRevealLifecycleListeners();
}

/** @deprecated Use unbindPoemRevealLifecycleListeners */
export function unbindPoemDiscoveryRevealLifecycleListeners(): void {
  unbindPoemRevealLifecycleListeners();
}

bindPoemRevealLifecycleListeners();
