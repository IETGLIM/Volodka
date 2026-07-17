/**
 * Convert interaction splash presets into unified timeline phases.
 * Each camera segment between waypoints becomes one phase (camera-only).
 */

import type { InteractionSplashPreset } from '@/data/interactionSplashes';
import type { ResolvedInteractionSplash } from '@/engine/interaction/resolveInteractionSplash';
import type { CameraWaypointData } from '@/shared/types/camera';
import type { CinematicTimelineDef, CinematicTimelinePhase } from './cinematicTimelineTypes';

function overlayFromPreset(preset: InteractionSplashPreset) {
  if (!preset.textOverlay && preset.letterboxStyle === 'none') return undefined;
  return {
    text: preset.textOverlay ?? '',
    subtitle: preset.subtitle,
    accentColor: preset.textAccentColor ?? '#44ffff',
    letterboxStyle: preset.letterboxStyle ?? 'thin',
  };
}

function waypointsToPhases(
  waypoints: CameraWaypointData[],
  preset?: InteractionSplashPreset,
): CinematicTimelinePhase[] {
  if (waypoints.length === 0) return [];

  const overlay = preset ? overlayFromPreset(preset) : undefined;

  if (waypoints.length === 1) {
    return [{
      id: 'splash_hold',
      duration: Math.max(waypoints[0].duration, 0.5),
      actor: { mode: 'none' },
      camera: { mode: 'hold', at: waypoints[0] },
      overlay,
    }];
  }

  const phases: CinematicTimelinePhase[] = [];
  for (let i = 1; i < waypoints.length; i++) {
    phases.push({
      id: `splash_seg_${i}`,
      duration: Math.max(waypoints[i].duration, 0.001),
      actor: { mode: 'none' },
      camera: {
        mode: 'waypoint',
        from: waypoints[i - 1],
        to: waypoints[i],
      },
      overlay: i === waypoints.length - 1 ? overlay : undefined,
    });
  }
  return phases;
}

export function splashPresetToTimeline(preset: InteractionSplashPreset): CinematicTimelineDef {
  return {
    id: `splash_${preset.id}`,
    phases: waypointsToPhases(preset.waypoints, preset),
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
