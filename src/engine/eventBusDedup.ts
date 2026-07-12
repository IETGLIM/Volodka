/* ─── EventBus dedup — fixed-slot numeric hash cache (no JSON.stringify) ─── */

export const DEDUP_WINDOW_MS = 500;
export const MAX_DEDUP_CACHE_SIZE = 64;

/** Max primitive string chars folded into hash — avoids scanning huge quest text. */
const MAX_STRING_CHARS = 48;

/** Max array entries folded into hash — enough for id lists without O(n) join. */
const MAX_ARRAY_ENTRIES = 8;

const FNV_OFFSET = 2_166_136_261;
const FNV_PRIME = 16_777_619;

export type DedupSlot = { hash: number; ts: number };

export function createDedupSlots(): DedupSlot[] {
  return Array.from({ length: MAX_DEDUP_CACHE_SIZE }, () => ({ hash: 0, ts: 0 }));
}

function fnv1aUpdate(h: number, str: string): number {
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), FNV_PRIME);
  }
  return h;
}

function hashPrimitive(h: number, value: string | number | boolean): number {
  return fnv1aUpdate(h, String(value));
}

function hashStringField(h: number, value: string): number {
  if (value.length <= MAX_STRING_CHARS) {
    return fnv1aUpdate(h, value);
  }
  h = fnv1aUpdate(h, value.slice(0, MAX_STRING_CHARS));
  return fnv1aUpdate(h, `+${value.length}`);
}

function hashArrayField(h: number, value: unknown[]): number {
  h = fnv1aUpdate(h, `len:${value.length}`);
  let folded = 0;
  for (const entry of value) {
    if (folded >= MAX_ARRAY_ENTRIES) break;
    if (typeof entry === 'string') {
      h = hashStringField(h, entry);
      folded += 1;
    } else if (typeof entry === 'number' || typeof entry === 'boolean') {
      h = hashPrimitive(h, entry);
      folded += 1;
    }
  }
  return h;
}

/**
 * Stable 32-bit hash from event name + primitive payload fields.
 * Nested objects/arrays-of-objects are skipped (identity dedup only on scalars).
 */
export function hashDedupPayload(event: string, payload: unknown): number {
  let h = fnv1aUpdate(FNV_OFFSET, event);

  if (payload === null || payload === undefined) {
    return h >>> 0;
  }
  if (typeof payload !== 'object') {
    return hashPrimitive(h, payload as string | number | boolean) >>> 0;
  }

  const obj = payload as Record<string, unknown>;
  const keys = Object.keys(obj);
  if (keys.length === 0) {
    return h >>> 0;
  }

  keys.sort();
  let primitiveFields = 0;

  for (const key of keys) {
    const value = obj[key];
    if (value === undefined) continue;

    h = fnv1aUpdate(h, key);

    if (typeof value === 'string') {
      h = hashStringField(h, value);
      primitiveFields += 1;
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      h = hashPrimitive(h, value);
      primitiveFields += 1;
    } else if (Array.isArray(value)) {
      h = hashArrayField(h, value);
      primitiveFields += 1;
    }
  }

  // Payload was only nested refs (e.g. npcStates) — distinguish by field names, not values.
  if (primitiveFields === 0) {
    h = fnv1aUpdate(h, keys.join(','));
  }

  return h >>> 0;
}

/** Expire stale slots in-place (optional explicit sweep — normally done in dedupShouldSuppress). */
export function pruneDedupSlots(
  slots: DedupSlot[],
  now: number,
  windowMs: number = DEDUP_WINDOW_MS,
): void {
  for (const slot of slots) {
    if (slot.ts !== 0 && now - slot.ts > windowMs) {
      slot.hash = 0;
      slot.ts = 0;
    }
  }
}

/**
 * Returns true when emission should be suppressed (duplicate within window).
 * Single O(MAX_DEDUP_CACHE_SIZE) pass — no Map, no retained key strings.
 */
export function dedupShouldSuppress(
  slots: DedupSlot[],
  hash: number,
  now: number,
  windowMs: number = DEDUP_WINDOW_MS,
): boolean {
  let emptyIdx = -1;
  let oldestIdx = 0;
  let oldestTs = Infinity;

  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];

    if (slot.ts !== 0 && now - slot.ts > windowMs) {
      slot.hash = 0;
      slot.ts = 0;
    }

    if (slot.ts === 0) {
      if (emptyIdx === -1) emptyIdx = i;
      continue;
    }

    if (slot.hash === hash) {
      return true;
    }

    if (slot.ts < oldestTs) {
      oldestTs = slot.ts;
      oldestIdx = i;
    }
  }

  const idx = emptyIdx !== -1 ? emptyIdx : oldestIdx;
  slots[idx].hash = hash;
  slots[idx].ts = now;
  return false;
}

export function clearDedupSlots(slots: DedupSlot[]): void {
  for (const slot of slots) {
    slot.hash = 0;
    slot.ts = 0;
  }
}
