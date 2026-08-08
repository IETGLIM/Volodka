/* ─── Volodka RPG – Cinematic Camera Presets ───
   Pre-defined camera configurations for common cutscene shots.
   Each preset defines: FOV, height offset, distance, angle, transition duration.
   Used by CinematicTimelineRunner and CutsceneOverlay for consistent framing.
*/

import type { CameraWaypointData } from '@/shared/types/camera';

/* ══════════════════════════════════════════════════════════════
   PRESET TYPES
   ══════════════════════════════════════════════════════════════ */

/** A camera preset describes the desired framing for a cinematic shot.
 *  Position and lookAt are offsets from the subject (NPC/player). */
export interface CinematicCameraPreset {
  /** Preset identifier — used in timeline definitions */
  id: string;
  /** Human-readable description for dev tools */
  description: string;
  /** Camera field of view in degrees */
  fov: number;
  /** Height offset above the subject (meters) */
  heightOffset: number;
  /** Horizontal distance from subject (meters) */
  distance: number;
  /** Y-axis rotation offset from facing the subject (radians) */
  angle: number;
  /** Recommended transition duration to reach this shot (seconds) */
  transitionDuration: number;
  /** Easing curve for transition — cubic-bezier control points */
  ease: [number, number, number, number];
  /** Build a CameraWaypointData at runtime, anchored to a subject position.
   *  @param subjectPos - World position of the subject (NPC/player)
   *  @param subjectFacing - Y-axis rotation the subject faces (radians)
   */
  toWaypoint(
    subjectPos: [number, number, number],
    subjectFacing?: number,
  ): CameraWaypointData;
}

/* ══════════════════════════════════════════════════════════════
   EASING CURVES
   ══════════════════════════════════════════════════════════════ */

const EASE_CINEMATIC: [number, number, number, number] = [0.16, 1, 0.3, 1];
const EASE_DRAMATIC: [number, number, number, number] = [0.22, 0.61, 0.36, 1];
const EASE_SNAP: [number, number, number, number] = [0.25, 0.1, 0.25, 1];
const EASE_BREATHE: [number, number, number, number] = [0.45, 0, 0.55, 1];

/* ══════════════════════════════════════════════════════════════
   PRESET FACTORY
   ══════════════════════════════════════════════════════════════ */

function createPreset(def: Omit<CinematicCameraPreset, 'toWaypoint'>): CinematicCameraPreset {
  return {
    ...def,
    toWaypoint(
      subjectPos: [number, number, number],
      subjectFacing = 0,
    ): CameraWaypointData {
      const [sx, sy, sz] = subjectPos;
      const effectiveAngle = def.angle + subjectFacing;
      const camX = sx + Math.sin(effectiveAngle) * def.distance;
      const camZ = sz + Math.cos(effectiveAngle) * def.distance;
      const camY = sy + def.heightOffset;
      const lookY = sy + Math.max(0, def.heightOffset * 0.3);

      return {
        position: [camX, camY, camZ],
        lookAt: [sx, lookY, sz],
        fov: def.fov,
        duration: def.transitionDuration,
      };
    },
  };
}

/* ══════════════════════════════════════════════════════════════
   PRESET DEFINITIONS
   ══════════════════════════════════════════════════════════════ */

/** Wide establishing shot — shows the full scene context */
export const ESTABLISHING_WIDE = createPreset({
  id: 'establishing_wide',
  description: 'Wide establishing shot — full scene context',
  fov: 40,
  heightOffset: 3.5,
  distance: 8,
  angle: -0.4,
  transitionDuration: 2.5,
  ease: EASE_CINEMATIC,
});

/** Over-the-shoulder dialogue shot — classic conversation framing */
export const OVER_SHOULDER = createPreset({
  id: 'over_shoulder',
  description: 'Over-the-shoulder dialogue shot',
  fov: 32,
  heightOffset: 0.4,
  distance: 1.8,
  angle: 0.25,
  transitionDuration: 1.2,
  ease: EASE_SNAP,
});

/** Tight close-up for emotional moments — shallow DOF feel */
export const CLOSE_UP_EMOTIONAL = createPreset({
  id: 'close_up_emotional',
  description: 'Tight close-up — emotional intimacy',
  fov: 28,
  heightOffset: 0.1,
  distance: 1.2,
  angle: 0.0,
  transitionDuration: 1.8,
  ease: EASE_DRAMATIC,
});

/** Low angle for power/intimidation — subject looms large */
export const LOW_ANGLE_POWER = createPreset({
  id: 'low_angle_power',
  description: 'Low angle — power and intimidation',
  fov: 24,
  heightOffset: -0.8,
  distance: 2.5,
  angle: -0.15,
  transitionDuration: 1.5,
  ease: EASE_DRAMATIC,
});

/** Dutch angle for tension/unease — tilted horizon */
export const DUTCH_ANGLE = createPreset({
  id: 'dutch_angle',
  description: 'Dutch angle — tension and unease',
  fov: 30,
  heightOffset: 0.2,
  distance: 3.0,
  angle: 0.6,
  transitionDuration: 1.4,
  ease: EASE_BREATHE,
});

/** Side tracking shot — follows subject laterally */
export const TRACKING_LATERAL = createPreset({
  id: 'tracking_lateral',
  description: 'Side tracking shot — lateral movement',
  fov: 35,
  heightOffset: 0.3,
  distance: 3.5,
  angle: Math.PI / 2, // 90° — side view
  transitionDuration: 2.0,
  ease: EASE_CINEMATIC,
});

/** Rising crane shot for dramatic reveals */
export const CRANE_RISING = createPreset({
  id: 'crane_rising',
  description: 'Rising crane — dramatic reveal',
  fov: 36,
  heightOffset: 5.0,
  distance: 6.0,
  angle: -0.3,
  transitionDuration: 3.0,
  ease: EASE_CINEMATIC,
});

/* ══════════════════════════════════════════════════════════════
   PRESET REGISTRY
   ══════════════════════════════════════════════════════════════ */

/** All camera presets indexed by id */
export const CINEMATIC_CAMERA_PRESETS: Readonly<Record<string, CinematicCameraPreset>> = {
  [ESTABLISHING_WIDE.id]: ESTABLISHING_WIDE,
  [OVER_SHOULDER.id]: OVER_SHOULDER,
  [CLOSE_UP_EMOTIONAL.id]: CLOSE_UP_EMOTIONAL,
  [LOW_ANGLE_POWER.id]: LOW_ANGLE_POWER,
  [DUTCH_ANGLE.id]: DUTCH_ANGLE,
  [TRACKING_LATERAL.id]: TRACKING_LATERAL,
  [CRANE_RISING.id]: CRANE_RISING,
} as const;

/** Get a preset by id. Returns null for unknown ids. */
export function getCinematicCameraPreset(id: string): CinematicCameraPreset | null {
  return CINEMATIC_CAMERA_PRESETS[id] ?? null;
}

/** Get the recommended easing curve for a transition type */
export function getPresetEase(id: string): [number, number, number, number] {
  return CINEMATIC_CAMERA_PRESETS[id]?.ease ?? EASE_CINEMATIC;
}
