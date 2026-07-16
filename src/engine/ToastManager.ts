/* ─── Volodka RPG – Toast Manager (thin wrapper around EventBus) ───
   Delegates all pub/sub to the shared EventBus ('toast:add' event).
   Same public API as before — zero consumer changes required.

   Prefer `notify()` from UnifiedNotifications.ts for new code.
   This module exists for backward compatibility.
*/

/* ─── Types (unchanged — re-exported for consumers) ─── */

export type ToastType = 'karma' | 'energy' | 'stress' | 'skill' | 'poem' | 'quest' | 'crafting';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  delta?: number;
  timestamp: number;
}

type ToastListener = (toast: ToastMessage) => void;

/* ─── Toast Manager class (EventBus delegation) ─── */

import { eventBus } from '@/engine/EventBus';

class ToastManagerClass {
  private nextId = 0;

  /** Emit a toast through EventBus. Same API as before. */
  addToast(type: ToastType, message: string, delta?: number): void {
    eventBus.emit('toast:add', {
      id: `toast-${this.nextId++}-${Date.now()}`,
      type,
      message,
      delta,
      timestamp: Date.now(),
    });
  }

  /** Subscribe to toast events via EventBus. Returns an unsubscribe function. */
  subscribe(listener: ToastListener): () => void {
    return eventBus.on('toast:add', listener);
  }
}

/** Singleton toast manager instance */
export const toastManager = new ToastManagerClass();
