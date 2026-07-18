/**
 * Event-driven API for starting/stopping unified cinematic timelines.
 */

import { eventBus } from '@/engine/EventBus';
import {
  setCinematicHoldActive,
  setCinematicPresentationMode,
} from '@/engine/camera/cinematicPresentation';
import { isEffectiveReducedMotion } from '@/engine/accessibility/accessibilitySettings';
import { devWarn } from '@/shared/utils/devLog';
import { getCinematicTimelineTotalDuration } from './cinematicTimelineController';
import type {
  CinematicTimelineDef,
  CinematicTimelineRuntimeOptions,
} from './cinematicTimelineTypes';

export interface CinematicTimelineStartPayload {
  def: CinematicTimelineDef;
  options?: CinematicTimelineRuntimeOptions;
}

let activeTimelineId: string | null = null;
const listeners = new Set<() => void>();
let orphanWatchdogTimer: ReturnType<typeof setTimeout> | null = null;

/** Extra grace period (seconds) beyond the expected total duration before the watchdog fires. */
const ORPHAN_WATCHDOG_GRACE_SEC = 15;

function clearOrphanWatchdog(): void {
  if (orphanWatchdogTimer !== null) {
    clearTimeout(orphanWatchdogTimer);
    orphanWatchdogTimer = null;
  }
}

function scheduleOrphanWatchdog(timelineId: string, totalDurationSec: number): void {
  clearOrphanWatchdog();
  const timeoutMs = (totalDurationSec + ORPHAN_WATCHDOG_GRACE_SEC) * 1000;
  orphanWatchdogTimer = setTimeout(() => {
    orphanWatchdogTimer = null;
    devWarn(
      `[cinematicTimelineOrchestrator] Orphan watchdog fired for timeline "${timelineId}" ` +
        `(expected ~${totalDurationSec.toFixed(1)}s + ${ORPHAN_WATCHDOG_GRACE_SEC}s grace). ` +
        'Auto-stopping — the component likely unmounted without completing the timeline.',
    );
    // Use completeCinematicTimeline (not stop) so downstream listeners
    // waiting for 'cinematic:timeline_complete' can properly resume gameplay.
    // Without this, the orphan watchdog would leave the game stuck forever
    // in a cinematic hold with no 'complete' event ever emitted.
    completeCinematicTimeline(timelineId, true);
  }, timeoutMs);
}

function notifyTimelineListeners(): void {
  for (const listener of listeners) {
    listener();
  }
}

/** Subscribe to timeline active-state changes (for React useSyncExternalStore). */
export function subscribeCinematicTimeline(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

export function getActiveCinematicTimelineId(): string | null {
  return activeTimelineId;
}

export function isCinematicTimelineActive(): boolean {
  return activeTimelineId !== null;
}

export function startCinematicTimeline(payload: CinematicTimelineStartPayload): boolean {
  const { def, options = {} } = payload;
  if (activeTimelineId === def.id) return false;

  const skipMotion = options.skipMotion ?? isEffectiveReducedMotion();
  if (skipMotion) {
    eventBus.emit('cinematic:timeline_complete', {
      timelineId: def.id,
      skipped: true,
    });
    return true;
  }

  // ── Guard: prevent timeline overwrite / camera lock (Race #6) ──
  // If a *different* timeline is already active, explicitly stop it first.
  // Without this, the old timeline's completeCinematicTimeline() call would
  // fail the activeTimelineId check and silently do nothing — its camera
  // hold and cinematic presentation mode would remain stuck forever if
  // the new timeline is also interrupted.
  if (activeTimelineId !== null) {
    devWarn(
      `[cinematicTimelineOrchestrator] Stopping active timeline "${activeTimelineId}" ` +
        `before starting "${def.id}" — concurrent timeline start detected.`,
    );
    const oldId = activeTimelineId;
    clearOrphanWatchdog();
    activeTimelineId = null;
    setCinematicHoldActive(false);
    eventBus.emit('cinematic:timeline_stop', { timelineId: oldId });
  }

  activeTimelineId = def.id;
  setCinematicPresentationMode('third_person');
  setCinematicHoldActive(true);
  notifyTimelineListeners();

  const totalDurationSec = getCinematicTimelineTotalDuration(def);
  scheduleOrphanWatchdog(def.id, totalDurationSec);

  eventBus.emit('cinematic:timeline_start', {
    def,
    options: { ...options, skipMotion: false },
    totalDurationSec,
    fallbackMs: def.fallbackMs,
  });

  return true;
}

export function stopCinematicTimeline(timelineId?: string): void {
  if (timelineId && activeTimelineId !== timelineId) return;
  if (!activeTimelineId) return;

  clearOrphanWatchdog();
  const id = activeTimelineId;
  activeTimelineId = null;
  setCinematicHoldActive(false);
  setCinematicPresentationMode('third_person');
  notifyTimelineListeners();

  eventBus.emit('cinematic:timeline_stop', { timelineId: id });
  eventBus.emit('cutscene:overlay_end', {});
  eventBus.emit('camera:recenter', {});
}

export function completeCinematicTimeline(timelineId: string, skipped = false): void {
  if (activeTimelineId !== timelineId) return;
  clearOrphanWatchdog();
  activeTimelineId = null;
  setCinematicHoldActive(false);
  setCinematicPresentationMode('third_person');
  notifyTimelineListeners();

  eventBus.emit('cinematic:timeline_complete', { timelineId, skipped });
  eventBus.emit('cutscene:overlay_end', {});
  eventBus.emit('camera:recenter', {});
}

export function skipCinematicTimeline(): void {
  if (!activeTimelineId) return;
  eventBus.emit('cinematic:timeline_skip', { timelineId: activeTimelineId });
}

/** Reset module state (unit tests). */
export function resetCinematicTimelineOrchestratorForTests(): void {
  clearOrphanWatchdog();
  activeTimelineId = null;
  notifyTimelineListeners();
}

/** Dispose module-level state on engine teardown. Safe to call multiple times. */
export function disposeCinematicTimelineOrchestrator(): void {
  clearOrphanWatchdog();
  if (activeTimelineId !== null) {
    activeTimelineId = null;
    setCinematicHoldActive(false);
    setCinematicPresentationMode('third_person');
  }
  notifyTimelineListeners();
}
