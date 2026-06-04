/* ─── Volodka RPG – Unified Notifications ───
   Single entry point for all notification flows in the game.
   Bridges EventBus toast events ↔ Zustand notification state.

   Architecture:
     1. `notify()` pushes to BOTH Zustand state AND EventBus ('toast:add')
        → Zustand state is the source of truth for persistent notification history
        → EventBus enables any component to react in real-time
     2. `onNotification()` subscribes to EventBus 'toast:add' events
     3. `dismissNotification()` removes from Zustand store

   This replaces the need for separate ToastManager pub/sub + Zustand notifications.
   ToastManager now delegates to EventBus internally (see ToastManager.ts).
*/

import { eventBus } from '@/engine/EventBus';
import { useGameStore } from '@/store/gameStore';
import type { NotificationType } from '@/store/shared';

/** All toast/notification types used across the game */
export type UnifiedNotificationType = NotificationType;

/* ─── Notify: push to Zustand + emit on EventBus ─── */

/**
 * Fire a notification that reaches BOTH the Zustand store (for history/persistence)
 * AND the EventBus (for real-time toast UI rendering).
 *
 * This is the recommended single entry point for all in-game notifications.
 * Replaces the old pattern of calling both pushNotification() + toastManager.addToast().
 */
export function notify(
  type: UnifiedNotificationType,
  text: string,
  delta?: number,
): void {
  // 1. Push to Zustand notification state (source of truth)
  useGameStore.getState().pushNotification(type, text);

  // 2. Emit on EventBus for real-time toast UI
  eventBus.emit('toast:add', {
    id: `unified-${type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type,
    message: text,
    delta,
    timestamp: Date.now(),
  });
}

/* ─── Subscribe: listen for notification events ─── */

/**
 * Subscribe to all toast notification events flowing through EventBus.
 * Returns an unsubscribe function.
 */
export function onNotification(
  handler: (payload: { id: string; type: UnifiedNotificationType; message: string; delta?: number; timestamp: number }) => void,
): () => void {
  return eventBus.on('toast:add', handler);
}

/* ─── Dismiss: remove from Zustand store ─── */

/**
 * Dismiss a notification by ID (removes from Zustand state).
 */
export function dismissNotification(id: string): void {
  useGameStore.getState().dismissNotification(id);
}
