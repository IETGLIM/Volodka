/**
 * Spreads GLTF preload kicks across idle slices so scene:enter does not start
 * a dozen Draco/Meshopt decodes in the same frame.
 */

import { eventBus } from '@/engine/EventBus';

export enum GltfPreloadPriority {
  Critical = 0,
  High = 1,
  Normal = 2,
  Low = 3,
  Deferred = 4,
}

type QueueEntry = {
  run: () => void;
  priority: GltfPreloadPriority;
};

const queue = new Map<string, QueueEntry>();
let generation = 0;
let drainHandle: ReturnType<typeof setTimeout> | number | null = null;
let manualPauseActive = false;
let uiOverlayPauseCount = 0;
let preloadPaused = false;
let combatLifecycleHooked = false;

/** FIX P0 #8: Safety timer that force-resumes preload if `combat:end` never
 *  fires (e.g., combat crashes mid-fight, edge-case flee path skips the emit).
 *  Without this, the GLB preload queue would silently stay paused forever —
 *  the player would leave combat and background NPC/prop preloads would
 *  degrade to lazy on-approach loading for the rest of the session.
 *  60s is well above any reasonable combat duration; the worst case if
 *  combat:end does fire late is a single redundant `setGltfPreloadPaused(false)`
 *  call, which is idempotent. */
const COMBAT_PRELOAD_RESUME_TIMEOUT_MS = 60_000;
let combatResumeTimer: ReturnType<typeof setTimeout> | null = null;

function clearCombatResumeTimer(): void {
  if (combatResumeTimer !== null) {
    clearTimeout(combatResumeTimer);
    combatResumeTimer = null;
  }
}

function armCombatResumeTimer(): void {
  clearCombatResumeTimer();
  combatResumeTimer = setTimeout(() => {
    combatResumeTimer = null;
    if (manualPauseActive) {
      console.warn('[gltfPreloadScheduler] combat:end safety timeout — force-resuming preload');
      setGltfPreloadPaused(false);
    }
  }, COMBAT_PRELOAD_RESUME_TIMEOUT_MS);
}

function syncPreloadPaused(): void {
  const nextPaused = manualPauseActive || uiOverlayPauseCount > 0;
  if (preloadPaused === nextPaused) return;
  preloadPaused = nextPaused;
  if (preloadPaused) {
    cancelDrain();
    return;
  }
  if (queue.size > 0) scheduleDrain();
}

const BATCH_SIZE = 1;

function hookCombatPreloadLifecycle(): void {
  if (combatLifecycleHooked) return;
  combatLifecycleHooked = true;
  eventBus.on('combat:end', () => {
    // FIX P0 #8: cancel the safety timer — combat ended normally.
    clearCombatResumeTimer();
    setGltfPreloadPaused(false);
  });
}

/** Pause idle GLB preloads during encounter beat / combat UI mount (main-thread headroom). */
export function setGltfPreloadPaused(paused: boolean): void {
  if (manualPauseActive === paused) return;
  manualPauseActive = paused;
  syncPreloadPaused();
}

/** Pause background GLB preloads while examine / story overlays are open. */
export function pauseGltfPreloadForUiOverlay(): void {
  uiOverlayPauseCount += 1;
  syncPreloadPaused();
}

export function resumeGltfPreloadForUiOverlay(): void {
  uiOverlayPauseCount = Math.max(0, uiOverlayPauseCount - 1);
  syncPreloadPaused();
}

export function isGltfPreloadPaused(): boolean {
  return preloadPaused;
}

/** Encounter presentation — defer background NPC/prop preloads until combat ends. */
export function pauseGltfPreloadForEncounter(): void {
  hookCombatPreloadLifecycle();
  setGltfPreloadPaused(true);
  // FIX P0 #8: arm safety timer — if combat:end never fires, force-resume
  // after 60s so the preload queue doesn't silently stay paused forever.
  armCombatResumeTimer();
}

function cancelDrain(): void {
  if (drainHandle === null) return;
  if (typeof cancelIdleCallback !== 'undefined' && typeof drainHandle === 'number') {
    cancelIdleCallback(drainHandle);
  } else {
    clearTimeout(drainHandle as ReturnType<typeof setTimeout>);
  }
  drainHandle = null;
}

function scheduleDrain(): void {
  if (preloadPaused || drainHandle !== null || queue.size === 0) return;

  const gen = generation;
  const drain = () => {
    drainHandle = null;
    if (gen !== generation) return;
    drainBatch(gen);
  };

  if (typeof requestIdleCallback !== 'undefined') {
    drainHandle = requestIdleCallback(drain, { timeout: 48 });
  } else {
    drainHandle = setTimeout(drain, 0);
  }
}

function drainBatch(gen: number): void {
  if (preloadPaused || gen !== generation || queue.size === 0) return;

  const entries = [...queue.entries()].sort(
    (a, b) => a[1].priority - b[1].priority,
  );

  let processed = 0;
  for (const [url, entry] of entries) {
    if (processed >= BATCH_SIZE) break;
    queue.delete(url);
    try {
      entry.run();
    } catch (err) {
      console.warn('[gltfPreloadScheduler] preload failed:', url, err);
    }
    processed += 1;
  }

  if (queue.size > 0) scheduleDrain();
}

/** Queue a GLB URL for idle-time preload. Duplicate URLs coalesce to highest priority. */
export function scheduleGltfPreload(
  url: string,
  run: () => void,
  priority: GltfPreloadPriority,
): void {
  if (!url) return;

  const existing = queue.get(url);
  if (existing) {
    if (priority < existing.priority) {
      queue.set(url, { run, priority });
    }
    scheduleDrain();
    return;
  }

  queue.set(url, { run, priority });
  scheduleDrain();
}

/** Drop pending preloads when the destination scene changes. */
export function resetGltfPreloadQueue(): void {
  generation += 1;
  queue.clear();
  cancelDrain();
}

/** Test-only reset */
export function resetGltfPreloadSchedulerForTests(): void {
  resetGltfPreloadQueue();
  manualPauseActive = false;
  uiOverlayPauseCount = 0;
  preloadPaused = false;
  // FIX P0 #8: don't leak the safety timer between test cases.
  clearCombatResumeTimer();
}
