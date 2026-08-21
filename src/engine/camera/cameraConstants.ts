/* ─── Follow-camera tuning constants (shared by strategies) ─── */

import type { SceneId } from '@/shared/types/game';
import { getSceneConfig } from '@/config/scenes';

/**
 * Max Payne–style over-the-shoulder chase distance.
 * Slightly tighter than classic orbit so the shoulder bias reads clearly.
 */
export const OTS_DEFAULT_DISTANCE = 2.35;
export const DEFAULT_DISTANCE = OTS_DEFAULT_DISTANCE;
export const MIN_DISTANCE = 1.1;
export const MAX_DISTANCE = 15.0;

/**
 * Lateral shoulder bias (m) along camera-right before collision.
 * Positive = over the character's right shoulder (OTS).
 */
export const SHOULDER_OFFSET_X = 0.45;

/**
 * Soft auto-follow (camera yaw lerps behind body while moving).
 * Off for Max Payne OTS — mouse/stick own look; body faces camera instead.
 */
export const EXPLORATION_SOFT_AUTO_FOLLOW = false;

/** First-person exploration — disabled; third-person OTS is the default. */
export const FIRST_PERSON_ENABLED = false;
export const FIRST_PERSON_EYE_HEIGHT = 1.62;
export const FIRST_PERSON_FOV = 74;
export const FIRST_PERSON_FOV_MIN = 55;
export const FIRST_PERSON_FOV_MAX = 90;

/** Multiplicative wheel zoom — higher = faster pinch toward the character's back. */
export const ZOOM_WHEEL_EXP = 0.011;
/** Minimum per-tick distance change (m) so trackpads still feel responsive. */
export const ZOOM_WHEEL_MIN_STEP = 0.12;
/** Spring snap strength after wheel input (0–1, applied once per frame until decay). */
export const ZOOM_SPRING_SNAP = 0.74;
/** Smooth zoom interpolation speed (higher = faster settle). */
export const ZOOM_SMOOTH_SPEED = 6.0;
/** Camera lag/interpolation factor (0.05 = heavy lag, 0.15 = responsive). */
export const CAMERA_LAG_FACTOR = 0.08;
/** Camera rotation inertia decay (higher = faster stop). */
export const CAMERA_INERTIA_DECAY = 5.5;
/** Camera rotation inertia gain (how much velocity builds per mouse delta). */
export const CAMERA_INERTIA_GAIN = 0.6;
export const LOOK_HEIGHT = 1.32;
export const WALL_MARGIN = 0.25;

export const AUTO_FOLLOW_SPEED = 4.05;
export const AUTO_FOLLOW_IDLE_THRESHOLD = 0.24;
export const AUTO_FOLLOW_MIN_YAW_DELTA = 0.035;
export const AUTO_FOLLOW_RETURN_SPEED = 2.1;

export const NPC_INTERACTION_DISTANCE = 2.0;
export const DISTANCE_LERP_SPEED = 2.45;
export const DIALOGUE_EXIT_LERP_SPEED = 4.85;
export const BREATHING_BOB_AMPLITUDE = 0.005;
export const BREATHING_BOB_SPEED = Math.PI;
export const LOOK_AHEAD_STRENGTH = 0.38;
export const LOOK_AHEAD_LERP_SPEED = 5.15;
/** Crouch camera height offset (m) — camera lowers when crouching. */
export const CROUCH_CAMERA_HEIGHT_OFFSET = -0.55;
/** Block camera height offset (m) — camera lowers slightly when blocking. */
export const BLOCK_CAMERA_HEIGHT_OFFSET = -0.15;
export const INDOOR_FOV = 52;
export const OUTDOOR_FOV = 73;
export const FOV_TRANSITION_SPEED = 3.25;

export const CINEMATIC_FREEZE_TIMEOUT = 2.0;

export const INTRO_WAKE_DURATION = 3.0;
export const INTRO_WAKE_START_DISTANCE = 1.2;
export const INTRO_WAKE_END_DISTANCE = DEFAULT_DISTANCE;

/** Poem-reading ritual — slow dolly toward Volodka (third-person hold). */
export const POEM_READING_DURATION = 4.0;
export const POEM_READING_START_DISTANCE = 2.4;
export const POEM_READING_END_DISTANCE = 0.85;
export const POEM_READING_START_PITCH = 0.22;
export const POEM_READING_END_PITCH = 0.12;

const INDOOR_SCENES: Set<SceneId> = new Set([
  'volodka_room',
  'volodka_corridor',
  'home_evening',
  'cafe_evening',
  'office_day',
  'library_day',
  'library_basement',
  'abandoned_factory',
  'factory_basement',
  'guild_mainframe',
  'zarema_albert_room',
  'zarema_room',
  'albert_backroom',
  'underground_bunker',
  'solnysh_room',
]);

export function getSceneDefaultDistance(sceneId: SceneId): number {
  const config = getSceneConfig(sceneId);
  const [width, depth] = config.size;
  const area = width * depth;
  if (area <= 16) return 3.0;
  if (area <= 36) return 2.8;
  if (area <= 64) return 4.2;
  return 5.5;
}

export function getSceneSpecificFov(sceneId: SceneId): number {
  return INDOOR_SCENES.has(sceneId) ? INDOOR_FOV : OUTDOOR_FOV;
}
