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
import { dispatchGameAction } from '@/engine/GameActionDispatcher';
import type { NotificationType } from '@/store/shared';

/** All toast/notification types used across the game */
export type UnifiedNotificationType = NotificationType;

export function notify(
  type: UnifiedNotificationType,
  text: string,
  delta?: number,
): void {
  dispatchGameAction({ type: 'notification/push', notificationType: type, text });

  eventBus.emit('toast:add', {
    id: `unified-${type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type,
    message: text,
    delta,
    timestamp: Date.now(),
  });
}

export function onNotification(
  handler: (payload: { id: string; type: UnifiedNotificationType; message: string; delta?: number; timestamp: number }) => void,
): () => void {
  return eventBus.on('toast:add', handler);
}

export function dismissNotification(id: string): void {
  dispatchGameAction({ type: 'notification/dismiss', id });
}
