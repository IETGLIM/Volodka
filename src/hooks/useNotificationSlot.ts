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
 */

import { useEffect, useSyncExternalStore } from 'react';

export const NOTIFY_PRIORITY = {
  quest: 100,
  event: 90,
  toast: 70,
  achievement: 60,
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
}

let nextOrder = 0;
const claims = new Map<string, Claim>();
let grantedIds: ReadonlySet<string> = new Set();
const listeners = new Set<() => void>();

function recompute(): void {
  const sorted = [...claims.values()].sort(
    (a, b) => b.priority - a.priority || a.order - b.order,
  );
  const next = new Set(sorted.slice(0, MAX_VISIBLE).map((c) => c.id));
  // Only notify when the granted set actually changed
  if (next.size === grantedIds.size && [...next].every((id) => grantedIds.has(id))) return;
  grantedIds = next;
  for (const listener of listeners) listener();
}

function claim(id: string, priority: number): void {
  if (!claims.has(id)) {
    claims.set(id, { id, priority, order: nextOrder++ });
    recompute();
  }
}

function release(id: string): void {
  if (claims.delete(id)) recompute();
}

function subscribe(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

/**
 * Claim a display slot while `wants` is true.
 * Returns true when this channel is allowed to render its card.
 */
export function useNotificationSlot(
  channelId: string,
  priority: number,
  wants: boolean,
): boolean {
  useEffect(() => {
    if (!wants) return;
    claim(channelId, priority);
    return () => release(channelId);
  }, [channelId, priority, wants]);

  const granted = useSyncExternalStore(
    subscribe,
    () => grantedIds.has(channelId),
    () => true,
  );

  return wants && granted;
}
