/**
 * Event-driven API for starting/stopping unified cinematic timelines.
 */

import { eventBus } from '@/engine/EventBus';
import {
  setCinematicHoldActive,
  setCinematicPresentationMode,
} from '@/engine/camera/cinematicPresentation';
import { isEffectiveReducedMotion } from '@/engine/accessibility/accessibilitySettings';
import { musicEngine } from '@/engine/MusicEngine';
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

/** Music duck factor applied while a cinematic timeline is active (30%). */
const CINEMATIC_TIMELINE_DUCK_FACTOR = 0.3;
/** Fast duck ramp on timeline start (seconds). */
const CINEMATIC_TIMELINE_DUCK_RAMP_S = 0.5;
/** Slower restore ramp on timeline stop/complete (seconds). */
const CINEMATIC_TIMELINE_RESTORE_RAMP_S = 1.0;

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
    // Part 2D: skipped timelines never duck, but a prior timeline's duck
    // factor may still be applied. Restore to 1.0 (fast ramp — skipped
    // timelines are instant) so music returns to full volume.
    musicEngine.setMusicDuckFactor(1.0, CINEMATIC_TIMELINE_DUCK_RAMP_S);
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
    // Part 2D: the new timeline will re-duck below, but restore first so
    // the ramp restarts cleanly from 1.0 (avoids a stuck mid-duck value
    // if the new timeline is skipMotion and bails before re-ducking).
    musicEngine.setMusicDuckFactor(1.0, CINEMATIC_TIMELINE_DUCK_RAMP_S);
    eventBus.emit('cinematic:timeline_stop', { timelineId: oldId });
  }

  activeTimelineId = def.id;
  setCinematicPresentationMode('third_person');
  setCinematicHoldActive(true);
  notifyTimelineListeners();

  // Part 2D: Duck music to 30% over 0.5s so the cinematic dialogue/stingers
  // sit clearly on top of the ambient bed. Restored on stop/complete.
  musicEngine.setMusicDuckFactor(CINEMATIC_TIMELINE_DUCK_FACTOR, CINEMATIC_TIMELINE_DUCK_RAMP_S);

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

  // Part 2D: Restore music volume over 1.0s for a smooth handoff back to gameplay.
  musicEngine.setMusicDuckFactor(1.0, CINEMATIC_TIMELINE_RESTORE_RAMP_S);

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

  // Part 2D: Restore music volume over 1.0s for a smooth handoff back to gameplay.
  musicEngine.setMusicDuckFactor(1.0, CINEMATIC_TIMELINE_RESTORE_RAMP_S);

  eventBus.emit('cinematic:timeline_complete', { timelineId, skipped });
  eventBus.emit('cutscene:overlay_end', {});
  eventBus.emit('camera:recenter', {});
}

export function skipCinematicTimeline(): void {
  if (!activeTimelineId) return;
  const id = activeTimelineId;
  eventBus.emit('cinematic:timeline_skip', { timelineId: id });
  // If the runner has no state yet (unmounted / pre-start), force-complete so
  // Escape doesn't claim success while the timeline stays stuck.
  queueMicrotask(() => {
    if (activeTimelineId === id) {
      completeCinematicTimeline(id, true);
    }
  });
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
    // Part 2D: restore music duck factor so the next session doesn't boot
    // with music stuck at 30%.
    musicEngine.setMusicDuckFactor(1.0, CINEMATIC_TIMELINE_RESTORE_RAMP_S);
  }
  notifyTimelineListeners();
}
