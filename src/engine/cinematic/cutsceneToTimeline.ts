/**
 * Convert story CutsceneDef (authoring schema) into CinematicTimelineDef
 * (canonical runtime descriptor). Same waypoint→phase path as interaction splashes.
 *
 * Story cutscene playback goes through `startCinematicTimeline(cutsceneDefToTimeline(...))`
 * from `useCutsceneController` — one camera/overlay path with CinematicTimelineRunner.
 */

import type { CutsceneDef } from '@/data/cutscenes';
import type { CinematicTimelineDef } from './cinematicTimelineTypes';
import { waypointsToTimelinePhases } from './cinematicWaypointPhases';

function overlayFromCutscene(cutscene: CutsceneDef) {
  return {
    text: cutscene.textOverlay,
    subtitle: cutscene.subtitle,
    accentColor: cutscene.textAccentColor,
    letterboxStyle: cutscene.letterboxStyle ?? 'full',
    showEmbers: cutscene.showEmbers,
    glitchIntensity: cutscene.glitchIntensity,
  };
}

/** Waypoint sum (s) → ms, floored against textDurationMs + grace — matches useCutsceneController. */
export function estimateCutsceneDisplayDurationMs(cutscene: CutsceneDef): number {
  const waypointSumMs = cutscene.waypoints.reduce(
    (sum, w) => sum + Math.max(0, w.duration) * 1000,
    0,
  );
  return Math.max(cutscene.textDurationMs, waypointSumMs + 800);
}

export function cutsceneDefToTimeline(cutscene: CutsceneDef): CinematicTimelineDef {
  const displayMs = estimateCutsceneDisplayDurationMs(cutscene);
  return {
    id: `cutscene_${cutscene.id}`,
    phases: waypointsToTimelinePhases(cutscene.waypoints, overlayFromCutscene(cutscene), {
      phaseIdPrefix: 'cutscene',
    }),
    fallbackMs: displayMs + 2500,
  };
}
