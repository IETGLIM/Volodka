import { EMPTY_EVENT_PAYLOAD } from './emptyPayload';

/**
 * Photo mode screenshot feature — PhotoMode, HUD, GameOrchestrator.
 *
 * Fully migrated domain: use PHOTO_EVENTS constants instead of string literals.
 */
export interface PhotoEvents {
  'photo:toggle': Record<string, never>;
  'photo:active': Record<string, never>;
  'photo:inactive': Record<string, never>;
  /** Request a device-pixel-ratio change (photo mode enters @2x, exits @1x). */
  'photo:dpr_request': { dpr: number };
  /** Toggle boosted lighting rig while photo mode is active. */
  'photo:lighting_boost': { active: boolean };
  /** Toggle motion-blur post-fx while photo mode is active. */
  'photo:motion_blur': { enabled: boolean };
}

/** Canonical event names for the photo domain. */
export const PHOTO_EVENTS = {
  toggle: 'photo:toggle',
  active: 'photo:active',
  inactive: 'photo:inactive',
  dprRequest: 'photo:dpr_request',
  lightingBoost: 'photo:lighting_boost',
  motionBlur: 'photo:motion_blur',
} as const satisfies Record<string, keyof PhotoEvents>;

export type PhotoEventKey = keyof PhotoEvents;

/** Empty payload shared by all photo mode events. */
export const PHOTO_EMPTY_PAYLOAD = EMPTY_EVENT_PAYLOAD;
