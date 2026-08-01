/* ─── Volodka RPG – Notification Type Definitions ───
   Central re-export of all notification/toast types used by the game.
   Import from here for convenience instead of reaching into
   ToastManager.ts or shared/types/notifications.ts directly. */

export type { ToastType, ToastMessage } from '@/engine/ToastManager';
export type { NotificationType, GameNotification } from '@/shared/types/notifications';
