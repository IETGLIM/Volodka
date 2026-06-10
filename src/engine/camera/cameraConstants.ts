/* ─── Follow-camera tuning constants (shared by strategies) ─── */

import type { SceneId } from '@/shared/types/game';
import { getSceneConfig } from '@/config/scenes';

export const DEFAULT_DISTANCE = 3.0;
export const MIN_DISTANCE = 0.65;
export const MAX_DISTANCE = 12.0;

/** First-person exploration — no third-person body; camera at eye height. */
export const FIRST_PERSON_ENABLED = true;
export const FIRST_PERSON_EYE_HEIGHT = 1.62;
export const FIRST_PERSON_FOV = 72;
export const FIRST_PERSON_FOV_MIN = 55;
export const FIRST_PERSON_FOV_MAX = 88;

/** Multiplicative wheel zoom — higher = faster pinch toward the character's back. */
export const ZOOM_WHEEL_EXP = 0.011;
/** Minimum per-tick distance change (m) so trackpads still feel responsive. */
export const ZOOM_WHEEL_MIN_STEP = 0.12;
/** Spring snap strength after wheel input (0–1, applied once per frame until decay). */
export const ZOOM_SPRING_SNAP = 0.72;
export const LOOK_HEIGHT = 1.3;
export const WALL_MARGIN = 0.25;

export const AUTO_FOLLOW_SPEED = 3.0;
export const AUTO_FOLLOW_IDLE_THRESHOLD = 0.3;
export const AUTO_FOLLOW_MIN_YAW_DELTA = 0.05;
export const AUTO_FOLLOW_RETURN_SPEED = 1.5;

export const NPC_INTERACTION_DISTANCE = 2.0;
export const DISTANCE_LERP_SPEED = 2.0;
export const DIALOGUE_EXIT_LERP_SPEED = 4.0;
export const BREATHING_BOB_AMPLITUDE = 0.005;
export const BREATHING_BOB_SPEED = Math.PI;
export const LOOK_AHEAD_STRENGTH = 0.15;
export const LOOK_AHEAD_LERP_SPEED = 3.0;
export const INDOOR_FOV = 55;
export const OUTDOOR_FOV = 70;
export const FOV_TRANSITION_SPEED = 2.5;

export const CINEMATIC_FREEZE_TIMEOUT = 2.0;

export const INTRO_WAKE_DURATION = 3.0;
export const INTRO_WAKE_START_DISTANCE = 1.2;
export const INTRO_WAKE_END_DISTANCE = DEFAULT_DISTANCE;

const INDOOR_SCENES: Set<SceneId> = new Set([
  'volodka_room',
  'volodka_corridor',
  'home_evening',
  'cafe_evening',
  'office_day',
  'library_day',
  'abandoned_factory',
  'zarema_albert_room',
]);

export function getSceneDefaultDistance(sceneId: SceneId): number {
  const config = getSceneConfig(sceneId);
  const [width, depth] = config.size;
  const area = width * depth;
  if (area <= 16) return 2.2;
  if (area <= 36) return 2.8;
  if (area <= 64) return 4.2;
  return 5.5;
}

export function getSceneSpecificFov(sceneId: SceneId): number {
  return INDOOR_SCENES.has(sceneId) ? INDOOR_FOV : OUTDOOR_FOV;
}
