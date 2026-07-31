/**
 * Convert interaction splash presets into unified timeline phases.
 * Each camera segment between waypoints becomes one phase (camera-only).
 */

import type { InteractionSplashPreset } from '@/data/interactionSplashes';
import type { ResolvedInteractionSplash } from '@/engine/interaction/resolveInteractionSplash';
import type { CinematicTimelineDef } from './cinematicTimelineTypes';
import { waypointsToTimelinePhases } from './cinematicWaypointPhases';

function overlayFromPreset(preset: InteractionSplashPreset) {
  if (!preset.textOverlay && preset.letterboxStyle === 'none') return undefined;
  return {
    text: preset.textOverlay ?? '',
    subtitle: preset.subtitle,
    accentColor: preset.textAccentColor ?? '#44ffff',
    letterboxStyle: preset.letterboxStyle ?? 'thin',
  };
}

export function splashPresetToTimeline(preset: InteractionSplashPreset): CinematicTimelineDef {
  return {
    id: `splash_${preset.id}`,
    phases: waypointsToTimelinePhases(preset.waypoints, overlayFromPreset(preset), {
      phaseIdPrefix: 'splash',
    }),
    fallbackMs: preset.durationMs + 500,
  };
}

export function resolvedSplashToTimeline(splash: ResolvedInteractionSplash): CinematicTimelineDef {
  const def = splashPresetToTimeline(splash.preset);
  return {
    ...def,
    anchor: { position: splash.anchorPosition },
    fallbackMs: splash.durationMs + 500,
  };
}
