/** Shared empty payload for events with no fields. */
export type EmptyEventPayload = Record<string, never>;

/** Runtime empty payload — use instead of `{} as Record<string, never>`. */
export const EMPTY_EVENT_PAYLOAD: EmptyEventPayload = {};
