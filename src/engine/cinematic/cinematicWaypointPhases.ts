/**
 * Shared waypoint → timeline phase conversion.
 * Story cutscenes and interaction splashes both author camera paths as waypoints;
 * runtime consumers use CinematicTimelineDef via this helper.
 */

import type { CameraWaypointData } from '@/shared/types/camera';
import type { CinematicOverlayConfig, CinematicTimelinePhase } from './cinematicTimelineTypes';

export function waypointsToTimelinePhases(
  waypoints: CameraWaypointData[],
  overlay?: CinematicOverlayConfig,
  options?: {
    phaseIdPrefix?: string;
    cameraShake?: { intensity: number; frequency?: number };
  },
): CinematicTimelinePhase[] {
  if (waypoints.length === 0) return [];

  const prefix = options?.phaseIdPrefix ?? 'cam';
  const shake = options?.cameraShake;

  if (waypoints.length === 1) {
    return [
      {
        id: `${prefix}_hold`,
        duration: Math.max(waypoints[0].duration, 0.5),
        actor: { mode: 'none' },
        camera: { mode: 'hold', at: waypoints[0] },
        overlay,
        cameraShake: shake,
      },
    ];
  }

  const phases: CinematicTimelinePhase[] = [];
  for (let i = 1; i < waypoints.length; i++) {
    phases.push({
      id: `${prefix}_seg_${i}`,
      duration: Math.max(waypoints[i].duration, 0.001),
      actor: { mode: 'none' },
      camera: {
        mode: 'waypoint',
        from: waypoints[i - 1],
        to: waypoints[i],
      },
      overlay: i === waypoints.length - 1 ? overlay : undefined,
      cameraShake: i === 1 ? shake : undefined,
    });
  }
  return phases;
}
