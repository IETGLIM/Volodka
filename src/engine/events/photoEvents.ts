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
}

/** Canonical event names for the photo domain. */
export const PHOTO_EVENTS = {
  toggle: 'photo:toggle',
  active: 'photo:active',
  inactive: 'photo:inactive',
} as const satisfies Record<string, keyof PhotoEvents>;

export type PhotoEventKey = keyof PhotoEvents;

/** Empty payload shared by all photo mode events. */
export const PHOTO_EMPTY_PAYLOAD = EMPTY_EVENT_PAYLOAD;
