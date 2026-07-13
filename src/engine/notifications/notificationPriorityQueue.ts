/* ─── Volodka RPG – Notification Priority Queue ───
 *  Centralized priority queue that serializes all notification channels.
 *  Only 1 notification is visible at a time; the rest wait in the queue.
 *  Each notification displays for 3 seconds before the next one appears.
 *
 *  Priority levels (lower number = higher priority):
 *    1 (highest) — Achievement notifications
 *    2           — Quest updates
 *    3           — Lore discoveries
 *    4 (lowest)  — Generic system toasts, loot, weather, crafting
 *
 *  Architecture:
 *    Each notification channel still owns its own component for rich rendering.
 *    This queue decides WHICH channel gets the single visible slot and for how
 *    long. useNotificationSlot (MAX_VISIBLE=1) handles the slot arbitration;
 *    this module adds per-item timing so channels don't stack 3-5 cards.
 */

/* ─── Priority definitions ─── */

export const NOTIFICATION_PRIORITY = {
  /** Priority 1 (highest): Achievement unlocked */
  achievement: 1,
  /** Priority 2: Quest accepted / objective / complete / failed */
  quest: 2,
  /** Priority 3: Lore codex discovery */
  lore: 3,
  /** Priority 4 (lowest): Generic toasts, loot, weather, crafting, events */
  generic: 4,
} as const;

export type NotificationPriorityLevel = (typeof NOTIFICATION_PRIORITY)[keyof typeof NOTIFICATION_PRIORITY];

/* ─── Queue item ─── */

export interface QueuedNotification {
  /** Unique id for dedup and React key */
  id: string;
  /** Which channel produced this notification */
  channel: string;
  /** Priority level (1–4) */
  priority: NotificationPriorityLevel;
  /** FIFO tiebreaker (auto-assigned) */
  order: number;
  /** Timestamp for debugging */
  createdAt: number;
}

/* ─── Constants ─── */

/** How long each notification is displayed before the next one appears */
export const NOTIFICATION_DISPLAY_DURATION_MS = 3000;
/** Maximum queue size — oldest items are dropped beyond this */
const MAX_QUEUE_SIZE = 20;

/* ─── Queue state (module-level singleton) ─── */

let nextOrder = 0;
const queue: QueuedNotification[] = [];
let currentVisible: QueuedNotification | null = null;
let displayTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

function notifyListeners(): void {
  for (const listener of listeners) {
    try { listener(); } catch { /* ignore */ }
  }
}

/** Sort queue by priority (ascending = higher priority first), then FIFO */
function sortQueue(): void {
  queue.sort((a, b) => a.priority - b.priority || a.order - b.order);
}

/** Move to the next item in the queue */
function advanceQueue(): void {
  if (displayTimer != null) {
    clearTimeout(displayTimer);
    displayTimer = null;
  }

  if (queue.length === 0) {
    currentVisible = null;
    notifyListeners();
    return;
  }

  currentVisible = queue.shift()!;
  notifyListeners();

  // Auto-advance after display duration
  displayTimer = setTimeout(() => {
    displayTimer = null;
    advanceQueue();
  }, NOTIFICATION_DISPLAY_DURATION_MS);
}

/* ─── Public API ─── */

/** Enqueue a notification. If nothing is currently visible, it becomes visible immediately. */
export function enqueue(item: Omit<QueuedNotification, 'order' | 'createdAt'>): void {
  const full: QueuedNotification = {
    ...item,
    order: nextOrder++,
    createdAt: Date.now(),
  };

  // Dedup by id
  if (queue.some((q) => q.id === item.id) || currentVisible?.id === item.id) {
    return;
  }

  queue.push(full);
  sortQueue();

  // Trim queue if too large
  while (queue.length > MAX_QUEUE_SIZE) {
    queue.pop();
  }

  // If nothing is currently visible, start displaying
  if (currentVisible === null) {
    advanceQueue();
  } else {
    // If the new item has higher priority than the current one, preempt it
    if (full.priority < currentVisible.priority) {
      // Put current back at the front of the queue
      queue.unshift(currentVisible);
      sortQueue();
      advanceQueue();
    } else {
      notifyListeners();
    }
  }
}

/** Remove a specific notification by id (e.g., user clicked to dismiss). */
export function dequeue(id: string): void {
  const idx = queue.findIndex((q) => q.id === id);
  if (idx !== -1) {
    queue.splice(idx, 1);
  }

  if (currentVisible?.id === id) {
    advanceQueue();
  } else {
    notifyListeners();
  }
}

/** Get the currently visible notification (if any). */
export function getCurrentVisible(): QueuedNotification | null {
  return currentVisible;
}

/** Get the current queue length (items waiting). */
export function getQueueLength(): number {
  return queue.length;
}

/** Subscribe to queue changes. Returns an unsubscribe function. */
export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

/** Get a snapshot of the queue state for React useSyncExternalStore. */
export function getSnapshot(): { current: QueuedNotification | null; queueLength: number } {
  return { current: currentVisible, queueLength: queue.length };
}

/** Check if a given channel currently holds the visible slot. */
export function isChannelVisible(channelId: string): boolean {
  return currentVisible?.channel === channelId;
}

/** Reset the queue — used in tests. */
export function resetPriorityQueue(): void {
  if (displayTimer != null) {
    clearTimeout(displayTimer);
    displayTimer = null;
  }
  queue.length = 0;
  nextOrder = 0;
  currentVisible = null;
  notifyListeners();
}

/* ─── React hook ─── */

import { useSyncExternalStore } from 'react';

/** React hook that returns the current visible notification from the priority queue. */
export function useNotificationPriorityQueue(): { current: QueuedNotification | null; queueLength: number } {
  return useSyncExternalStore(subscribe, getSnapshot, () => ({ current: null, queueLength: 0 }));
}

/** React hook: returns true if the given channel currently holds the visible slot. */
export function useIsChannelVisible(channelId: string): boolean {
  const { current } = useNotificationPriorityQueue();
  return current?.channel === channelId;
}
