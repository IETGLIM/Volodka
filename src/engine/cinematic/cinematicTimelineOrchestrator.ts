/**
 * Event-driven API for starting/stopping unified cinematic timelines.
 */

import { eventBus } from '@/engine/EventBus';
import {
  setCinematicHoldActive,
  setCinematicPresentationMode,
} from '@/engine/camera/cinematicPresentation';
import { isEffectiveReducedMotion } from '@/engine/accessibility/accessibilitySettings';
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

  activeTimelineId = def.id;
  setCinematicPresentationMode('third_person');
  setCinematicHoldActive(true);

  eventBus.emit('cinematic:timeline_start', {
    def,
    options: { ...options, skipMotion: false },
    totalDurationSec: getCinematicTimelineTotalDuration(def),
    fallbackMs: def.fallbackMs,
  });

  return true;
}

export function stopCinematicTimeline(timelineId?: string): void {
  if (timelineId && activeTimelineId !== timelineId) return;
  if (!activeTimelineId) return;

  const id = activeTimelineId;
  activeTimelineId = null;
  setCinematicHoldActive(false);
  setCinematicPresentationMode('third_person');

  eventBus.emit('cinematic:timeline_stop', { timelineId: id });
  eventBus.emit('cutscene:overlay_end', {});
  eventBus.emit('camera:recenter', {});
}

export function completeCinematicTimeline(timelineId: string, skipped = false): void {
  if (activeTimelineId !== timelineId) return;
  activeTimelineId = null;
  setCinematicHoldActive(false);
  setCinematicPresentationMode('third_person');

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
  activeTimelineId = null;
}
