/* ─── Volodka RPG – notification slot arbiter ───
 *  The game has 7 independent notification channels (toasts, quest popups,
 *  achievements, loot, crafting, weather, events). Without coordination they
 *  stack into a wall of cards. This arbiter lets at most MAX_VISIBLE channels
 *  show at once, ordered by priority — the rest wait for a free slot and
 *  re-appear automatically (their internal queues are untouched).
 *
 *  Usage in a channel component:
 *    const granted = useNotificationSlot('loot', NOTIFY_PRIORITY.loot, wantsToShow);
 *    if (!granted) return null; // or keep mounted but hidden
 *
 *  Critical channels (e.g. save/load failures) bypass the visible cap.
 */

import { useEffect, useSyncExternalStore } from 'react';

export const NOTIFY_PRIORITY = {
  quest: 100,
  event: 90,
  toast: 70,
  achievement: 60,
  system: 58,
  lore: 55,
  weather: 40,
  crafting: 30,
  loot: 20,
} as const;

const MAX_VISIBLE = 2;

interface Claim {
  id: string;
  priority: number;
  /** FIFO tiebreaker for equal priority */
  order: number;
  critical: boolean;
}

let nextOrder = 0;
const claims = new Map<string, Claim>();
let grantedIds: ReadonlySet<string> = new Set();
const listeners = new Set<() => void>();

function recompute(): void {
  const sorted = [...claims.values()].sort(
    (a, b) => b.priority - a.priority || a.order - b.order,
  );
  const critical = sorted.filter((claim) => claim.critical);
  const normal = sorted.filter((claim) => !claim.critical);
  const remainingSlots = Math.max(0, MAX_VISIBLE - critical.length);
  const next = new Set([
    ...critical.map((claim) => claim.id),
    ...normal.slice(0, remainingSlots).map((claim) => claim.id),
  ]);
  if (next.size === grantedIds.size && [...next].every((id) => grantedIds.has(id))) return;
  grantedIds = next;
  for (const listener of listeners) listener();
}

function claim(id: string, priority: number, critical: boolean): void {
  const existing = claims.get(id);
  if (existing) {
    if (existing.priority !== priority || existing.critical !== critical) {
      claims.set(id, { ...existing, priority, critical });
      recompute();
    }
    return;
  }
  claims.set(id, { id, priority, order: nextOrder++, critical });
  recompute();
}

function release(id: string): void {
  if (claims.delete(id)) recompute();
}

function subscribe(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

export type NotificationSlotOptions = {
  /** Always render when wants=true, reserving a slot ahead of non-critical channels. */
  critical?: boolean;
};

/**
 * Claim a display slot while `wants` is true.
 * Returns true when this channel is allowed to render its card.
 */
export function useNotificationSlot(
  channelId: string,
  priority: number,
  wants: boolean,
  options?: NotificationSlotOptions,
): boolean {
  const critical = options?.critical ?? false;

  useEffect(() => {
    if (!wants) return;
    claim(channelId, priority, critical);
    return () => release(channelId);
  }, [channelId, priority, wants, critical]);

  const granted = useSyncExternalStore(
    subscribe,
    () => grantedIds.has(channelId),
    () => true,
  );

  if (critical && wants) return true;
  return wants && granted;
}

/** Test-only reset for notification slot state. */
export function resetNotificationSlotsForTests(): void {
  claims.clear();
  grantedIds = new Set();
  nextOrder = 0;
}
